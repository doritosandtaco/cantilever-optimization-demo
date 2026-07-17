"""
Reference Implementation of 2D Cantilever Beam Topology Optimization.
Uses SIMP method, Optimality Criteria, and Density Filter.
"""
import argparse
import json
import numpy as np
import scipy.sparse as sp
from scipy.sparse.linalg import cg
import matplotlib.pyplot as plt
import csv

def get_element_stiffness(E, nu, t, a, b):
    """
    Computes the element stiffness matrix for a 4-node rectangular plane stress element.
    """
    k = np.array([
        1/2-nu/6, 1/8+nu/8, -1/4-nu/12, -1/8+nu/24,
        -1/4+nu/12, -1/8-nu/8, nu/6, 1/8-nu/24
    ])
    
    # Plane stress element stiffness matrix terms (simplified version for square elements)
    # If elements are not square, a more rigorous numerical integration over the domain is needed.
    # We assume elements are square (a=b) for the classical 99-line type implementation
    # But let's write a general one based on classical FEA if possible.
    # For educational purposes and match with TS, we use a general integral for rectangular.
    
    # Actually, a standard 8x8 formulation for a rectangle 2a x 2b with thickness t
    # Using Gauss quadrature.
    pts = [-1/np.sqrt(3), 1/np.sqrt(3)]
    Ke = np.zeros((8,8))
    D = E / (1 - nu**2) * np.array([
        [1, nu, 0],
        [nu, 1, 0],
        [0, 0, (1-nu)/2]
    ])
    
    for xi in pts:
        for eta in pts:
            # Shape function derivatives w.r.t xi, eta
            dN_dxi = 0.25 * np.array([-(1-eta), 1-eta, 1+eta, -(1+eta)])
            dN_deta = 0.25 * np.array([-(1-xi), -(1+xi), 1+xi, 1-xi])
            
            J = np.array([
                [a, 0],
                [0, b]
            ])
            invJ = np.linalg.inv(J)
            detJ = np.linalg.det(J)
            
            # Derivatives w.r.t x, y
            dN = invJ @ np.vstack((dN_dxi, dN_deta))
            dN_dx = dN[0, :]
            dN_dy = dN[1, :]
            
            B = np.zeros((3, 8))
            B[0, 0::2] = dN_dx
            B[1, 1::2] = dN_dy
            B[2, 0::2] = dN_dy
            B[2, 1::2] = dN_dx
            
            Ke += B.T @ D @ B * detJ * t
            
    return Ke

def solve_topology_optimization(config):
    nelx = config.get("nelx", 60)
    nely = config.get("nely", 20)
    volfrac = config.get("volumeFraction", 0.4)
    penal = config.get("penalization", 3.0)
    rmin = config.get("filterRadius", 1.5)
    L = config.get("L", 300.0)
    H = config.get("H", 100.0)
    t = config.get("t", 10.0)
    E0 = config.get("E", 210000.0) # MPa
    nu = config.get("nu", 0.3)
    load = config.get("load", 10000.0) # N
    max_iter = config.get("maxIterations", 100)
    tol = config.get("convergenceTolerance", 0.01)
    
    Emin = 1e-6 * E0
    a = L / nelx / 2.0
    b = H / nely / 2.0
    
    Ke = get_element_stiffness(1.0, nu, t, a, b)
    
    ndof = 2 * (nelx + 1) * (nely + 1)
    
    # Build element DOF mapping
    edofMat = np.zeros((nelx*nely, 8), dtype=int)
    for elx in range(nelx):
        for ely in range(nely):
            el = elx * nely + ely
            n1 = (nely + 1) * elx + ely
            n2 = (nely + 1) * (elx + 1) + ely
            edofMat[el, :] = np.array([
                2*n1, 2*n1+1, 2*n2, 2*n2+1, 2*n2+2, 2*n2+3, 2*n1+2, 2*n1+3
            ])
            
    iK = np.kron(edofMat, np.ones((8,1))).flatten()
    jK = np.kron(edofMat, np.ones((1,8))).flatten()
    
    # Define Loads and Supports
    F = np.zeros((ndof, 1))
    # Load at right middle
    load_node = (nelx) * (nely + 1) + (nely // 2)
    F[2*load_node+1, 0] = load
    
    # Fixed on the left side
    fixeddofs = np.arange(0, 2*(nely+1))
    alldofs = np.arange(0, ndof)
    freedofs = np.setdiff1d(alldofs, fixeddofs)
    
    # Filter setup
    iH = np.ones(nelx*nely*(int(np.ceil(rmin))**2+1)**2)
    jH = np.ones(iH.shape)
    sH = np.zeros(iH.shape)
    k = 0
    for i1 in range(nelx):
        for j1 in range(nely):
            e1 = i1 * nely + j1
            for i2 in range(max(i1 - int(np.ceil(rmin)), 0), min(i1 + int(np.ceil(rmin)) + 1, nelx)):
                for j2 in range(max(j1 - int(np.ceil(rmin)), 0), min(j1 + int(np.ceil(rmin)) + 1, nely)):
                    e2 = i2 * nely + j2
                    dist = np.sqrt((i1 - i2)**2 + (j1 - j2)**2)
                    if dist <= rmin:
                        iH[k] = e1
                        jH[k] = e2
                        sH[k] = rmin - dist
                        k += 1
    H_filter = sp.coo_matrix((sH[:k], (iH[:k], jH[:k])), shape=(nelx*nely, nelx*nely))
    Hs = np.array(H_filter.sum(axis=1)).flatten()
    
    # Initialize
    x = volfrac * np.ones(nelx * nely)
    xPhys = x.copy()
    
    loop = 0
    change = 1.0
    history = []
    
    while change > tol and loop < max_iter:
        loop += 1
        
        # FEA
        sK = ((Ke.flatten()[:, np.newaxis] * (Emin + xPhys**penal * (E0 - Emin))).T).flatten()
        K = sp.coo_matrix((sK, (iK, jK)), shape=(ndof, ndof)).tocsc()
        
        K_free = K[freedofs, :][:, freedofs]
        F_free = F[freedofs]
        
        U = np.zeros((ndof, 1))
        # Use PCG (or direct if small, but let's use CG to match app)
        U_free, info = cg(K_free, F_free, tol=1e-5)
        U[freedofs, 0] = U_free
        
        # Objective and Sensitivity
        ce = np.sum((U[edofMat] @ Ke) * U[edofMat], axis=1)
        c = np.sum((Emin + xPhys**penal * (E0 - Emin)) * ce)
        dc = -penal * xPhys**(penal-1) * (E0 - Emin) * ce
        
        # Filter Sensitivity
        dc = np.array(H_filter.dot(x * dc) / Hs / np.maximum(1e-3, x)).flatten()
        
        # Optimality Criteria
        l1 = 0
        l2 = 1e9
        move = 0.2
        while (l2 - l1) > 1e-4:
            lmid = 0.5 * (l2 + l1)
            xnew = np.maximum(0.001, np.maximum(x - move, np.minimum(1.0, np.minimum(x + move, x * np.sqrt(-dc / lmid)))))
            xPhys = np.array(H_filter.dot(xnew) / Hs).flatten()
            if np.mean(xPhys) > volfrac:
                l1 = lmid
            else:
                l2 = lmid
                
        change = np.max(np.abs(xnew - x))
        x = xnew
        
        print(f"It.: {loop:4d} Obj.: {c:10.4f} Vol.: {np.mean(xPhys):.3f} ch.: {change:.3f}")
        history.append({"iteration": loop, "compliance": float(c), "vol": float(np.mean(xPhys)), "change": float(change)})
        
    return xPhys, nelx, nely, history

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default="")
    args = parser.parse_args()
    
    config = {}
    if args.config:
        with open(args.config, "r") as f:
            config = json.load(f)
            
    xPhys, nelx, nely, history = solve_topology_optimization(config)
    
    # Save history
    with open("history.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["iteration", "compliance", "vol", "change"])
        writer.writeheader()
        writer.writerows(history)
        
    # Plot final topology
    plt.imshow(1 - xPhys.reshape((nelx, nely)).T, cmap='gray')
    plt.title("Topology Optimization Result")
    plt.colorbar()
    plt.savefig("result.png")
    plt.show()

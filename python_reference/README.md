# Python Reference Implementation for Topology Optimization

This folder contains a reference Python script that performs the same 2D Cantilever Beam topology optimization (SIMP method) as the web application.

## Prerequisites
- Python 3.11+

## Installation
```bash
pip install -r requirements.txt
```

## Usage
Run the script with default parameters:
```bash
python topopt_cantilever.py
```

You can optionally pass a JSON file containing configuration parameters.
```bash
python topopt_cantilever.py --config config.json
```

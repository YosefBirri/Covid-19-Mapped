import json
import numpy as np

with open('assets/us-covid-2020-rates.json') as f:
    data = json.load(f)

rates = [f['properties']['rates'] for f in data['features']]

print("Min:", np.min(rates))
print("Max:", np.max(rates))
print("Mean:", np.mean(rates))
print("Median:", np.median(rates))
print("Percentiles:", np.percentile(rates, [25,50,75,90,95]))
import csv
import random
import os

# Read the CSV file
input_file = '../Current_Batch_2025_No_SemMarks.csv'
output_file = '../Current_Batch_2025_No_SemMarks_Updated.csv'

rows = []
with open(input_file, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Update CA marks to be random values between 31 and 50 (more than 30)
        row['CA1'] = str(random.randint(31, 50))
        row['CA2'] = str(random.randint(31, 50))
        row['CA3'] = str(random.randint(31, 50))
        rows.append(row)

# Write back to a new file
with open(output_file, 'w', newline='') as f:
    fieldnames = rows[0].keys()
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"✓ Updated CSV created: {output_file}")
print(f"✓ Total records updated: {len(rows)}")
print(f"✓ Sample updated marks:")
for i, row in enumerate(rows[:5]):
    print(f"  {row['Register_No']} - {row['Subject_Name']}: CA1={row['CA1']}, CA2={row['CA2']}, CA3={row['CA3']}")

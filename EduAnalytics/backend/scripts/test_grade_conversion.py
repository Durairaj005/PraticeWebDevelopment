#!/usr/bin/env python3
"""Test grade conversion utilities"""

from app.utils.grade_converter import (
    get_grade_from_marks, 
    get_numeric_from_grade, 
    validate_grade,
    get_ca_pass_status,
    is_pass_grade
)

print('Testing Grade Conversion Utility')
print('=' * 50)

test_marks = [95, 85, 75, 65, 58, 52, 25]
print('\nMark to Grade Conversion:')
for mark in test_marks:
    grade = get_grade_from_marks(mark)
    numeric = get_numeric_from_grade(grade)
    print(f'  Marks: {mark:3d} → Grade: {grade:3s} → Numeric: {numeric:5.1f}')

print('\nGrade Validation:')
for grade in ['O', 'A+', 'A', 'B+', 'B', 'C', 'RA', 'X']:
    valid = validate_grade(grade)
    status = '✓ Valid' if valid else '✗ Invalid'
    print(f'  {grade:3s}: {status}')

print('\nCA Pass Status (>= 30/60):')
test_cas = [50, 35, 30, 25, 20]
for ca_avg in test_cas:
    passed = get_ca_pass_status(ca_avg)
    status = '✓ PASS' if passed else '✗ FAIL'
    print(f'  CA Avg: {ca_avg} → {status}')

print('\nGrade Pass/Fail Status:')
for grade in ['O', 'A+', 'A', 'B+', 'B', 'C', 'RA']:
    passed = is_pass_grade(grade)
    status = '✓ PASS' if passed else '✗ FAIL'
    print(f'  Grade {grade:3s} → {status}')

print('\n' + '=' * 50)
print('✅ All tests completed successfully!')

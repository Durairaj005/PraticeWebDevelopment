"""
Grade Conversion Utilities for Semester Examination
Converts between grades and numeric values according to grading scheme
"""

# Grading Scheme Mapping
GRADE_RANGES = {
    'O': (91, 100),      # Outstanding
    'A+': (81, 90),      # Excellent
    'A': (71, 80),       # Very Good
    'B+': (61, 70),      # Good
    'B': (56, 60),       # Average
    'C': (50, 55),       # Satisfactory
    'RA': (0, 49)        # Re-Appear
}

GRADE_TO_MIDPOINT = {
    'O': 95.5,      # (91+100)/2
    'A+': 85.5,     # (81+90)/2
    'A': 75.5,      # (71+80)/2
    'B+': 65.5,     # (61+70)/2
    'B': 58,        # (56+60)/2
    'C': 52.5,      # (50+55)/2
    'RA': 24.5      # (0+49)/2
}

def get_grade_from_marks(marks: float) -> str:
    """
    Convert numeric marks (0-100) to letter grade
    
    Args:
        marks: Float value between 0-100
        
    Returns:
        Letter grade: O, A+, A, B+, B, C, or RA
    """
    if marks is None:
        return None
        
    marks = float(marks)
    
    if marks >= 91:
        return 'O'
    elif marks >= 81:
        return 'A+'
    elif marks >= 71:
        return 'A'
    elif marks >= 61:
        return 'B+'
    elif marks >= 56:
        return 'B'
    elif marks >= 50:
        return 'C'
    else:
        return 'RA'


def get_numeric_from_grade(grade: str) -> float:
    """
    Convert letter grade to numeric midpoint value
    Used for calculations when semester results are published
    
    Args:
        grade: Letter grade (O, A+, A, B+, B, C, RA)
        
    Returns:
        Midpoint numeric value for the grade range
    """
    if grade is None:
        return None
        
    return GRADE_TO_MIDPOINT.get(grade.upper(), None)


def validate_grade(grade: str) -> bool:
    """
    Validate if grade is in accepted format
    
    Args:
        grade: Letter grade to validate
        
    Returns:
        True if valid, False otherwise
    """
    if grade is None:
        return True  # None is valid (not yet published)
        
    return grade.upper() in GRADE_RANGES or grade.upper() in GRADE_TO_MIDPOINT


def get_grade_description(grade: str) -> str:
    """
    Get full description of a grade
    
    Args:
        grade: Letter grade
        
    Returns:
        Description string
    """
    descriptions = {
        'O': 'Outstanding (91-100)',
        'A+': 'Excellent (81-90)',
        'A': 'Very Good (71-80)',
        'B+': 'Good (61-70)',
        'B': 'Average (56-60)',
        'C': 'Satisfactory (50-55)',
        'RA': 'Re-Appear (<50)'
    }
    return descriptions.get(grade.upper(), 'Unknown')


def is_pass_grade(grade: str) -> bool:
    """
    Check if a grade is a passing grade (not RA)
    
    Args:
        grade: Letter grade
        
    Returns:
        True if passing, False if RA or None
    """
    if grade is None:
        return None
    return grade.upper() != 'RA'


def get_ca_pass_status(ca_total: float) -> bool:
    """
    Check if CA marks qualify as pass (>= 30 out of 60)
    CA is average of CA1, CA2, CA3 which total to 300 marks
    Pass requirement: average >= 30/60 = 50%
    
    Args:
        ca_total: Sum of (CA1 + CA2 + CA3) / 3 (average CA marks)
        
    Returns:
        True if CA average >= 30, False otherwise
    """
    if ca_total is None:
        return False
    return float(ca_total) >= 30


# Grade distribution helper
def get_grade_distribution_counts(grades_list: list) -> dict:
    """
    Count distribution of grades
    
    Args:
        grades_list: List of grade strings
        
    Returns:
        Dictionary with counts: {'O': n, 'A+': n, ...}
    """
    distribution = {
        'O': 0,
        'A+': 0,
        'A': 0,
        'B+': 0,
        'B': 0,
        'C': 0,
        'RA': 0
    }
    
    for grade in grades_list:
        if grade and grade.upper() in distribution:
            distribution[grade.upper()] += 1
    
    return distribution

"""
Time utility functions for converting between HH:MM time strings and integer minutes from midnight.
"""

def time_to_minutes(t_str: str) -> int:
    """
    Converts 'HH:MM' or 'HH:MM:SS' string to integer minutes from midnight.
    e.g. '06:00' -> 360, '10:30' -> 630.
    """
    parts = t_str.strip().split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    return hours * 60 + minutes

def minutes_to_time(minutes: int) -> str:
    """
    Converts integer minutes from midnight to 'HH:MM' string.
    e.g. 360 -> '06:00', 630 -> '10:30'.
    """
    hours = (minutes // 60) % 24
    mins = minutes % 60
    return f"{hours:02d}:{mins:02d}"

def intervals_overlap(s1: int, e1: int, s2: int, e2: int) -> bool:
    """
    Returns True if open intervals (s1, e1) and (s2, e2) overlap.
    Overlap condition: s1 < e2 and e1 > s2.
    """
    return s1 < e2 and e1 > s2

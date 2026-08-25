import re
def mask(t):
    t=re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b','[EMAIL]',t)
    t=re.sub(r'\b(?:\+91[- ]?)?[6-9]\d{9}\b','[PHONE]',t)
    t=re.sub(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b','[PAN]',t)
    return t

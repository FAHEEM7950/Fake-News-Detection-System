"""preprocessor utilities"""

import re
import nltk
from nltk.corpus import stopwords

# Ensure resources
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

_STOPWORDS = set(stopwords.words('english'))

def clean_text(text: str) -> str:
    """Clean and tokenize text.
    Returns empty string for None/empty input."""
    if not text:
        return ''
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    tokens = nltk.word_tokenize(text)
    tokens = [t for t in tokens if t not in _STOPWORDS]
    return ' '.join(tokens)

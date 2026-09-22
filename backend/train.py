# Training script for Fake News Detection system
"""Training script for Fake News Detection system.

This script:
1. Loads the IFND.csv dataset (using only the `Statement` and `Label` columns).
2. Maps raw labels (`TRUE` → `REAL`, `Fake` → `FAKE`).
3. Validates label mapping.
4. Performs a reproducible stratified train/test split (80/20, random_state=42).
5. Applies text preprocessing via `backend.preprocessor.clean_text`.
6. Vectorizes statements using TF‑IDF.
7. Trains a Multinomial Naive Bayes classifier.
8. Evaluates accuracy, precision, recall, F1‑score for the `FAKE` class and prints a confusion matrix.
9. Saves the fitted TF‑IDF vectorizer and the trained model under `backend/model/`.

Run this script with:
    python -m backend.train
"""

import pathlib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)
import joblib

# Local import
from backend.preprocessor import clean_text

# Paths (project‑relative)
DATASET_PATH = pathlib.Path(__file__).resolve().parents[1] / "dataset" / "IFND.csv"
MODEL_DIR = pathlib.Path(__file__).resolve().parent / "model"


def load_data(csv_path: pathlib.Path) -> pd.DataFrame:
    """Load CSV and keep only `Statement` and `Label` columns."""
    return pd.read_csv(csv_path, usecols=["Statement", "Label"])


def map_labels(df: pd.DataFrame) -> pd.DataFrame:
    """Map raw labels to canonical ones."""
    label_map = {"TRUE": "REAL", "Fake": "FAKE"}
    df["Label"] = df["Label"].map(label_map)
    if df["Label"].isnull().any():
        raise ValueError("Unexpected label values after mapping.")
    return df


def prepare_data(df: pd.DataFrame):
    """Preprocess text and split into train / test sets."""
    df["cleaned"] = df["Statement"].apply(clean_text)
    X = df["cleaned"].values
    y = df["Label"].values
    return train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )


def train_and_evaluate(X_train, X_test, y_train, y_test):
    """Fit TF‑IDF, train Naive Bayes, evaluate and save artifacts."""
    vectorizer = TfidfVectorizer()
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    clf = MultinomialNB()
    clf.fit(X_train_vec, y_train)
    y_pred = clf.predict(X_test_vec)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, pos_label="FAKE", average="binary")
    rec = recall_score(y_test, y_pred, pos_label="FAKE", average="binary")
    f1 = f1_score(y_test, y_pred, pos_label="FAKE", average="binary")
    cm = confusion_matrix(y_test, y_pred, labels=["REAL", "FAKE"])

    print("=== Evaluation Metrics ===")
    print(f"Accuracy : {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall   : {rec:.4f}")
    print(f"F1‑Score : {f1:.4f}\n")
    print("Confusion Matrix (rows=actual, cols=predicted):")
    print(pd.DataFrame(cm, index=["REAL", "FAKE"], columns=["REAL", "FAKE"]))

    # Save artifacts
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(vectorizer, MODEL_DIR / "tfidf_vectorizer.joblib")
    joblib.dump(clf, MODEL_DIR / "naive_bayes_model.joblib")
    print(f"\nSaved vectorizer to {MODEL_DIR / 'tfidf_vectorizer.joblib'}")
    print(f"Saved model to {MODEL_DIR / 'naive_bayes_model.joblib'}")


def main():
    df = load_data(DATASET_PATH)
    df = map_labels(df)
    X_train, X_test, y_train, y_test = prepare_data(df)
    train_and_evaluate(X_train, X_test, y_train, y_test)


if __name__ == "__main__":
    main()

"""Training script for Fake News Detection system.

This script:
1. Loads the IFND.csv dataset (using only the `Statement` and `Label` columns).
2. Maps raw labels (`TRUE` â†’ `REAL`, `Fake` â†’ `FAKE`).
3. Validates label mapping.
4. Performs a reproducible stratified train/test split (80/20, random_state=42).
5. Applies text preprocessing via `backend.preprocessor.clean_text`.
6. Vectorizes statements using TFâ€‘IDF.
7. Trains a Multinomial Naive Bayes classifier.
8. Evaluates accuracy, precision, recall, F1â€‘score for the `FAKE` class and prints a confusion matrix.
9. Saves the fitted TFâ€‘IDF vectorizer and the trained model under `backend/model/`.

Run this script with:
    python -m backend.train
"""

import pathlib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)
import joblib

# Local import
from backend.preprocessor import clean_text

# Paths (projectâ€‘relative)
DATASET_PATH = pathlib.Path(__file__).resolve().parents[1] / "dataset" / "IFND.csv"
MODEL_DIR = pathlib.Path(__file__).resolve().parent / "model"


def load_data(csv_path: pathlib.Path) -> pd.DataFrame:
    """Load CSV and keep only `Statement` and `Label` columns."""
    return pd.read_csv(csv_path, usecols=["Statement", "Label"])


def map_labels(df: pd.DataFrame) -> pd.DataFrame:
    """Map raw labels to canonical ones."""
    label_map = {"TRUE": "REAL", "Fake": "FAKE"}
    df["Label"] = df["Label"].map(label_map)
    if df["Label"].isnull().any():
        raise ValueError("Unexpected label values after mapping.")
    return df


def prepare_data(df: pd.DataFrame):
    """Preprocess text and split into train / test sets."""
    df["cleaned"] = df["Statement"].apply(clean_text)
    X = df["cleaned"].values
    y = df["Label"].values
    return train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )


def train_and_evaluate(X_train, X_test, y_train, y_test):
    """Fit TFâ€‘IDF, train Naive Bayes, evaluate and save artifacts."""
    vectorizer = TfidfVectorizer()
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    clf = MultinomialNB()
    clf.fit(X_train_vec, y_train)
    y_pred = clf.predict(X_test_vec)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, pos_label="FAKE", average="binary")
    rec = recall_score(y_test, y_pred, pos_label="FAKE", average="binary")
    f1 = f1_score(y_test, y_pred, pos_label="FAKE", average="binary")
    cm = confusion_matrix(y_test, y_pred, labels=["REAL", "FAKE"])

    print("=== Evaluation Metrics ===")
    print(f"Accuracy : {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall   : {rec:.4f}")
    print(f"F1â€‘Score : {f1:.4f}\n")
    print("Confusion Matrix (rows=actual, cols=predicted):")
    print(pd.DataFrame(cm, index=["REAL", "FAKE"], columns=["REAL", "FAKE"]))

    # Save artifacts
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(vectorizer, MODEL_DIR / "tfidf_vectorizer.joblib")
    joblib.dump(clf, MODEL_DIR / "naive_bayes_model.joblib")
    print(f"\nSaved vectorizer to {MODEL_DIR / 'tfidf_vectorizer.joblib'}")
    print(f"Saved model to {MODEL_DIR / 'naive_bayes_model.joblib'}")


def main():
    df = load_data(DATASET_PATH)
    df = map_labels(df)
    X_train, X_test, y_train, y_test = prepare_data(df)
    train_and_evaluate(X_train, X_test, y_train, y_test)


if __name__ == "__main__":
    main()

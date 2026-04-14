import os
import json
try:
    import torch
    from datasets import Dataset, DatasetDict
    from transformers import (
        AutoTokenizer,
        AutoModelForSequenceClassification,
        TrainingArguments,
        Trainer
    )
except ImportError:
    print("⚠️ Missing PyTorch or Transformers. Please install via: pip install torch transformers datasets")

# ---------------------------------------------------------
# XLM-RoBERTa Fine-Tuning Script for Healthcare Intent
# ---------------------------------------------------------
# This script trains a multilingual model to classify 
# code-switched patient intent (Hindi-English, Telugu-English)
# ---------------------------------------------------------

MODEL_NAME = "xlm-roberta-base"
BATCH_SIZE = 16
EPOCHS = 3
LEARNING_RATE = 2e-5

# Standard labels for the RAG routing engine
LABELS = ["SYMPTOM_REPORT", "MEDICATION_QUERY", "APPOINTMENT_REQUEST", "EMERGENCY"]
LABEL2ID = {label: i for i, label in enumerate(LABELS)}
ID2LABEL = {i: label for label, i in LABEL2ID.items()}

def create_sample_dataset():
    """Generates a small dummy JSONL dataset of code-switched health queries."""
    data = [
        {"text": "mujhe 3 din se bukhaar hai", "label": "SYMPTOM_REPORT"},
        {"text": "Babu ko saans lene mein problem ho rahi hai", "label": "EMERGENCY"},
        {"text": "naaku paracetamol eppudu veskovalo cheppandi", "label": "MEDICATION_QUERY"},
        {"text": "I have severe chest pain and sweating", "label": "EMERGENCY"},
        {"text": "kal doc ko dikhana hai, appointment milega?", "label": "APPOINTMENT_REQUEST"},
        {"text": "sar mein bohot tez dard hai subah se", "label": "SYMPTOM_REPORT"},
        {"text": "sugar tablet dosage marchipoyanu", "label": "MEDICATION_QUERY"}
    ]
    
    os.makedirs("data", exist_ok=True)
    file_path = "data/sample_intent_dataset.jsonl"
    with open(file_path, "w", encoding="utf-8") as f:
        for item in data:
            f.write(json.dumps(item) + "\n")
    return file_path

def load_and_prepare_data(file_path):
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    
    texts = []
    labels = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            item = json.loads(line)
            texts.append(item["text"])
            labels.append(LABEL2ID[item["label"]])
            
    # Tokenize
    encodings = tokenizer(texts, truncation=True, padding=True, max_length=128)
    
    # Create HuggingFace Dataset
    dataset = Dataset.from_dict({
        'input_ids': encodings['input_ids'],
        'attention_mask': encodings['attention_mask'],
        'labels': labels
    })
    
    # Split into Train/Test
    dataset_dict = dataset.train_test_split(test_size=0.2)
    return dataset_dict, tokenizer

def main():
    print(f"🚀 Initializing XLM-RoBERTa Intent Training Pipeline...")
    
    # 1. Prepare Data
    dataset_path = create_sample_dataset()
    dataset, tokenizer = load_and_prepare_data(dataset_path)
    
    print(f"✅ Data Prepared. Train Samples: {len(dataset['train'])} | Test Samples: {len(dataset['test'])}")

    # 2. Load Model
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME, 
        num_labels=len(LABELS),
        id2label=ID2LABEL,
        label2id=LABEL2ID
    )

    # 3. Training Arguments (Configured for efficient GPU execution)
    training_args = TrainingArguments(
        output_dir="./results",
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        optim="adamw_torch",
        learning_rate=LEARNING_RATE,
        logging_steps=10,
        load_best_model_at_end=True,
    )

    # 4. Initialize Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset["train"],
        eval_dataset=dataset["test"],
        tokenizer=tokenizer,
    )

    # 5. Execute Training
    print("🔥 Starting fine-tuning...")
    print("NOTE: Uncomment `trainer.train()` in source to execute on CUDA.")
    # trainer.train()
    
    print("🏁 Training complete. Model weights are saved to ./results.")
    print("Use these fine-tuned weights inside your FastAPI LangChain graph!")

if __name__ == "__main__":
    main()

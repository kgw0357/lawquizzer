import os
import sys
import json
import sqlite3
from fastapi.testclient import TestClient

# Add current workspace directory to python path to import backend modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.main import app, init_db, get_db_connection
from backend.auth import hash_password, verify_password, generate_token, verify_token

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("RUNNING AUTOMATED VERIFICATION TESTS FOR LAW QUIZZER")
    print("=" * 60)
    
    # 1. Test Database Initialization
    print("\n1. Testing Database Initialization...")
    try:
        init_db()
        print("[OK] Database initialized successfully.")
    except Exception as e:
        print(f"[FAIL] Database initialization failed: {e}")
        return False
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check tables
    tables = [row["name"] for row in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    print(f"  Found tables: {tables}")
    for tbl in ["users", "quizzes", "incorrect_notes"]:
        if tbl not in tables:
            print(f"[FAIL] Table '{tbl}' not found in database.")
            conn.close()
            return False
    print("[OK] Tables verified.")
    conn.close()
    
    # 2. Test Password Hashing and Tokens
    print("\n2. Testing Cryptography and Authentication Helpers...")
    pw = "testpassword123"
    hashed = hash_password(pw)
    print(f"  Hashed password: {hashed[:40]}...")
    if not verify_password(pw, hashed):
        print("[FAIL] Password verification failed.")
        return False
    if verify_password("wrongpassword", hashed):
        print("[FAIL] Password verification allowed wrong password.")
        return False
    print("[OK] Password hashing and verification function successfully.")
    
    token = generate_token(42)
    print(f"  Generated token: {token[:40]}...")
    user_id = verify_token(token)
    if user_id != 42:
        print(f"[FAIL] Token verification failed. Expected 42, got {user_id}")
        return False
    print("[OK] Secure token generation and verification functions successfully.")
    
    # 3. Test Signup and Login API
    print("\n3. Testing Signup and Login Endpoints...")
    # Clear existing test user if any
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE email = ?", ("testuser@lawquizzer.com",))
    conn.commit()
    conn.close()
    
    # Test Signup
    res = client.post("/api/auth/signup", json={
        "email": "testuser@lawquizzer.com",
        "password": "securepassword123"
    })
    print(f"  Signup Response Code: {res.status_code}")
    if res.status_code != 200:
        print(f"[FAIL] Signup failed: {res.json()}")
        return False
    print("[OK] User sign up completed.")
    
    # Test Signup Duplicate email
    res = client.post("/api/auth/signup", json={
        "email": "testuser@lawquizzer.com",
        "password": "anotherpassword"
    })
    print(f"  Duplicate Signup Response Code: {res.status_code} (Expected 400)")
    if res.status_code != 400:
        print("[FAIL] Duplicate signup should have failed with 400.")
        return False
    print("[OK] Duplicate signup validation working.")
    
    # Test Login
    res = client.post("/api/auth/login", json={
        "email": "testuser@lawquizzer.com",
        "password": "securepassword123"
    })
    print(f"  Login Response Code: {res.status_code}")
    if res.status_code != 200:
        print(f"[FAIL] Login failed: {res.json()}")
        return False
    
    login_data = res.json()
    token = login_data["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] User login succeeded. Token issued.")
    
    # 4. Test Quiz Generation (Mock fallback mode)
    print("\n4. Testing Quiz Generation (Mock Fallback mode)...")
    res = client.post("/api/quizzes/generate", json={
        "text": "매도인의 하자담보책임 예시 텍스트입니다. 물건에 하자가 있는 경우 매수인은 권리를 가집니다.",
        "api_key": None
    }, headers=headers)
    print(f"  Quiz Generate Response Code: {res.status_code}")
    if res.status_code != 200:
        print(f"[FAIL] Quiz generation failed: {res.json()}")
        return False
    
    gen_data = res.json()
    quizzes = gen_data["quizzes"]
    print(f"  Generated {len(quizzes)} quizzes.")
    if len(quizzes) != 5:
        print("[FAIL] Quiz count was not exactly 5.")
        return False
    
    first_quiz = quizzes[0]
    print(f"  First Quiz Question: {first_quiz['question']}")
    print(f"  First Quiz Answer: {first_quiz['answer']}")
    print("[OK] Quiz generation and database logging completed.")
    
    # 5. Test Answer Check & Wrong Note logging
    print("\n5. Testing Answer Evaluation and Wrong Notes...")
    quiz_id = first_quiz["id"]
    correct_ans = first_quiz["answer"]
    wrong_ans = "X" if correct_ans == "O" else "O"
    
    # Answer incorrectly to log a wrong note
    res = client.post("/api/quizzes/answer", json={
        "quiz_id": quiz_id,
        "user_answer": wrong_ans
    }, headers=headers)
    print(f"  Answer Check (Incorrect) Response Code: {res.status_code}")
    if res.status_code != 200:
        print(f"[FAIL] Answer check endpoint failed: {res.json()}")
        return False
        
    ans_data = res.json()
    if ans_data["correct"] is not False:
        print("[FAIL] Answer check incorrectly evaluated wrong answer as correct.")
        return False
    print("[OK] Correctly identified wrong answer.")
    
    # Check if incorrect note is logged
    res = client.get("/api/notes/incorrect", headers=headers)
    print(f"  Get Incorrect Notes Response Code: {res.status_code}")
    notes = res.json()
    print(f"  Total incorrect notes saved: {len(notes)}")
    if len(notes) != 1:
        print("[FAIL] Wrong answer note was not logged in DB.")
        return False
        
    note = notes[0]
    note_id = note["note_id"]
    print(f"  Logged Question: {note['question']}")
    print(f"  User Answer: {note['user_answer']}")
    print(f"  Correct Answer: {note['correct_answer']}")
    print("[OK] Wrong answer note verified in DB.")
    
    # 6. Test Delete Note
    print("\n6. Testing Deleting Incorrect Note...")
    res = client.delete(f"/api/notes/incorrect/{note_id}", headers=headers)
    print(f"  Delete Note Response Code: {res.status_code}")
    if res.status_code != 200:
        print(f"[FAIL] Deleting incorrect note failed: {res.json()}")
        return False
        
    res = client.get("/api/notes/incorrect", headers=headers)
    notes = res.json()
    if len(notes) != 0:
        print("[FAIL] Wrong answer note was not deleted.")
        return False
    print("[OK] Deleted incorrect note verified.")
    
    print("\n" + "=" * 60)
    print("ALL TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = run_tests()
    if not success:
        sys.exit(1)

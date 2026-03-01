import requests
import sys
import json
import base64
from datetime import datetime
import time

class MedicalAppAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.patient_token = None
        self.doctor_token = None
        self.patient_user = None
        self.doctor_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    test_headers.pop('Content-Type', None)
                    response = requests.post(url, files=files, headers=test_headers)
                else:
                    response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_patient_registration(self):
        """Test patient registration"""
        timestamp = int(time.time())
        patient_data = {
            "email": f"patient_{timestamp}@test.com",
            "password": "TestPass123!",
            "full_name": "Juan Pérez",
            "role": "patient"
        }
        
        success, response = self.run_test(
            "Patient Registration",
            "POST",
            "auth/register",
            200,
            data=patient_data
        )
        
        if success and 'token' in response:
            self.patient_token = response['token']
            self.patient_user = response['user']
            return True
        return False

    def test_doctor_registration(self):
        """Test doctor registration"""
        timestamp = int(time.time())
        doctor_data = {
            "email": f"doctor_{timestamp}@test.com",
            "password": "TestPass123!",
            "full_name": "Dr. María García",
            "role": "doctor",
            "specialty": "Cardiología"
        }
        
        success, response = self.run_test(
            "Doctor Registration",
            "POST",
            "auth/register",
            200,
            data=doctor_data
        )
        
        if success and 'token' in response:
            self.doctor_token = response['token']
            self.doctor_user = response['user']
            return True
        return False

    def test_patient_login(self):
        """Test patient login"""
        if not self.patient_user:
            return False
            
        login_data = {
            "email": self.patient_user['email'],
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "Patient Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        return success and 'token' in response

    def test_get_patient_profile(self):
        """Test getting patient profile"""
        if not self.patient_token:
            return False
            
        success, response = self.run_test(
            "Get Patient Profile",
            "GET",
            "profile",
            200,
            headers={'Authorization': f'Bearer {self.patient_token}'}
        )
        
        return success

    def test_update_patient_profile(self):
        """Test updating patient profile"""
        if not self.patient_token:
            return False
            
        profile_data = {
            "blood_type": "O+",
            "allergies": ["Penicilina", "Mariscos"],
            "chronic_conditions": ["Hipertensión"],
            "current_medications": [
                {"name": "Lisinopril", "dosage": "10mg", "frequency": "1 vez al día"}
            ]
        }
        
        success, response = self.run_test(
            "Update Patient Profile",
            "PUT",
            "profile",
            200,
            data=profile_data,
            headers={'Authorization': f'Bearer {self.patient_token}'}
        )
        
        return success

    def test_get_doctors(self):
        """Test getting list of doctors"""
        if not self.patient_token:
            return False
            
        success, response = self.run_test(
            "Get Doctors List",
            "GET",
            "doctors",
            200,
            headers={'Authorization': f'Bearer {self.patient_token}'}
        )
        
        return success

    def test_send_doctor_message(self):
        """Test sending message to doctor"""
        if not self.patient_token or not self.doctor_user:
            return False
            
        message_data = {
            "content": "Hola doctor, tengo una consulta sobre mi medicación.",
            "recipient_id": self.doctor_user['id'],
            "chat_type": "doctor"
        }
        
        success, response = self.run_test(
            "Send Message to Doctor",
            "POST",
            "chat",
            200,
            data=message_data,
            headers={'Authorization': f'Bearer {self.patient_token}'}
        )
        
        return success

    def test_get_doctor_messages(self):
        """Test getting messages with doctor"""
        if not self.patient_token or not self.doctor_user:
            return False
            
        success, response = self.run_test(
            "Get Doctor Messages",
            "GET",
            f"chat/doctor?other_user_id={self.doctor_user['id']}",
            200,
            headers={'Authorization': f'Bearer {self.patient_token}'}
        )
        
        return success

    def test_ai_chat(self):
        """Test AI chat functionality"""
        if not self.patient_token:
            return False
            
        message_data = {
            "content": "¿Qué ejercicios me recomiendas para la hipertensión?",
            "chat_type": "ai"
        }
        
        print("🤖 Testing AI Chat (this may take a few seconds)...")
        success, response = self.run_test(
            "AI Chat Message",
            "POST",
            "chat",
            200,
            data=message_data,
            headers={'Authorization': f'Bearer {self.patient_token}'}
        )
        
        if success:
            # Verify AI response structure
            if 'user_message' in response and 'ai_response' in response:
                self.log_test("AI Chat Response Structure", True, "Both user and AI messages present")
                return True
            else:
                self.log_test("AI Chat Response Structure", False, "Missing user_message or ai_response")
        
        return success

    def test_get_ai_messages(self):
        """Test getting AI chat history"""
        if not self.patient_token:
            return False
            
        success, response = self.run_test(
            "Get AI Messages",
            "GET",
            "chat/ai",
            200,
            headers={'Authorization': f'Bearer {self.patient_token}'}
        )
        
        return success

    def test_generate_recommendations(self):
        """Test generating health recommendations"""
        if not self.patient_token:
            return False
            
        print("🧠 Testing AI Recommendations Generation (this may take a few seconds)...")
        success, response = self.run_test(
            "Generate Health Recommendations",
            "POST",
            "recommendations/generate",
            200,
            data={},
            headers={'Authorization': f'Bearer {self.patient_token}'}
        )
        
        return success

    def test_get_recommendations(self):
        """Test getting recommendations"""
        if not self.patient_token:
            return False
            
        success, response = self.run_test(
            "Get Recommendations",
            "GET",
            "recommendations",
            200,
            headers={'Authorization': f'Bearer {self.patient_token}'}
        )
        
        return success

    def test_document_upload(self):
        """Test document upload"""
        if not self.patient_token:
            return False
            
        # Create a simple test file
        test_content = "Test medical document content"
        
        files = {
            'file': ('test_document.txt', test_content, 'text/plain')
        }
        
        success, response = self.run_test(
            "Upload Document",
            "POST",
            "documents",
            200,
            files=files,
            headers={'Authorization': f'Bearer {self.patient_token}'}
        )
        
        return success

    def test_get_documents(self):
        """Test getting documents list"""
        if not self.patient_token:
            return False
            
        success, response = self.run_test(
            "Get Documents List",
            "GET",
            "documents",
            200,
            headers={'Authorization': f'Bearer {self.patient_token}'}
        )
        
        return success

    def test_doctor_get_patients(self):
        """Test doctor getting patients list"""
        if not self.doctor_token:
            return False
            
        success, response = self.run_test(
            "Doctor Get Patients",
            "GET",
            "patients",
            200,
            headers={'Authorization': f'Bearer {self.doctor_token}'}
        )
        
        return success

    def test_delete_account(self):
        """Test account deletion (run last)"""
        if not self.patient_token:
            return False
            
        success, response = self.run_test(
            "Delete Patient Account",
            "DELETE",
            "user/delete",
            200,
            headers={'Authorization': f'Bearer {self.patient_token}'}
        )
        
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🏥 Starting Medical App API Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Authentication Tests
        print("\n📝 Testing Authentication...")
        if not self.test_patient_registration():
            print("❌ Patient registration failed - stopping tests")
            return False
            
        if not self.test_doctor_registration():
            print("❌ Doctor registration failed - continuing with patient tests only")
            
        self.test_patient_login()
        
        # Profile Tests
        print("\n👤 Testing Patient Profile...")
        self.test_get_patient_profile()
        self.test_update_patient_profile()
        
        # Doctor Interaction Tests
        print("\n👨‍⚕️ Testing Doctor Interactions...")
        self.test_get_doctors()
        if self.doctor_user:
            self.test_send_doctor_message()
            self.test_get_doctor_messages()
            
        # AI Tests
        print("\n🤖 Testing AI Features...")
        self.test_ai_chat()
        self.test_get_ai_messages()
        self.test_generate_recommendations()
        self.test_get_recommendations()
        
        # Document Tests
        print("\n📄 Testing Document Management...")
        self.test_document_upload()
        self.test_get_documents()
        
        # Doctor Dashboard Tests
        if self.doctor_token:
            print("\n🩺 Testing Doctor Dashboard...")
            self.test_doctor_get_patients()
        
        # Privacy Tests (run last as it deletes the account)
        print("\n🔒 Testing Privacy Features...")
        self.test_delete_account()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_run - self.tests_passed > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = MedicalAppAPITester()
    
    try:
        tester.run_all_tests()
        success = tester.print_summary()
        
        # Save detailed results
        with open('/app/test_reports/backend_api_results.json', 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': tester.tests_run,
                    'passed': tester.tests_passed,
                    'failed': tester.tests_run - tester.tests_passed,
                    'success_rate': (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
                },
                'results': tester.test_results,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2)
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())

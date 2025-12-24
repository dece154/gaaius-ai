#!/usr/bin/env python3
"""
Priority tests for GAAIUS AI - Testing specific features mentioned in review request
"""
import requests
import sys
import json
import time
from datetime import datetime

class PriorityTester:
    def __init__(self, base_url="https://ai-command-hub-20.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.session_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            self.passed_tests.append(name)
            print(f"✅ {name} - PASSED")
        else:
            self.failed_tests.append({"test": name, "details": details})
            print(f"❌ {name} - FAILED: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {"status": "success", "content_type": response.headers.get('content-type', 'unknown')}
            else:
                error_detail = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail += f" - {response.json()}"
                except:
                    error_detail += f" - {response.text[:200]}"
                self.log_test(name, False, error_detail)
                return False, {}

        except requests.exceptions.Timeout:
            self.log_test(name, False, f"Request timeout after {timeout}s")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Request error: {str(e)}")
            return False, {}

    def setup_auth(self):
        """Setup authentication using provided test credentials"""
        # Try to login with provided test credentials
        success, response = self.run_test(
            "Login with Test Credentials",
            "POST",
            "auth/login",
            200,
            data={
                "email": "test2@example.com",
                "password": "password123"
            }
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Logged in as: {response['user']['email']}")
            return True
        else:
            # If login fails, try to register the test user
            print("   Login failed, trying to register test user...")
            success, response = self.run_test(
                "Register Test User",
                "POST",
                "auth/register",
                200,
                data={
                    "email": "test2@example.com",
                    "password": "password123",
                    "name": "Test User 2"
                }
            )
            
            if success and 'token' in response:
                self.token = response['token']
                self.user_id = response['user']['id']
                print(f"   Registered and logged in as: {response['user']['email']}")
                return True
        
        return False

    def test_pdf_generation(self):
        """Test PDF file generation specifically"""
        success, response = self.run_test(
            "PDF Generation",
            "POST",
            "file/generate",
            200,
            data={
                "prompt": "Create a PDF document with title 'GAAIUS AI Test Report' and content about AI capabilities",
                "file_type": "document"
            },
            timeout=60
        )
        
        if success:
            print(f"   Generated PDF: {response.get('file_url', '')}")
            print(f"   File Type: {response.get('file_type', 'Unknown')}")
            if response.get('file_type') == 'pdf':
                print("   ✅ PDF format confirmed")
            else:
                print(f"   ⚠️  Expected PDF, got {response.get('file_type', 'Unknown')}")
        return success

    def test_docx_generation(self):
        """Test DOCX file generation specifically"""
        success, response = self.run_test(
            "DOCX Generation",
            "POST",
            "file/generate",
            200,
            data={
                "prompt": "Create a DOCX document about GAAIUS AI features with multiple sections",
                "file_type": "document"
            },
            timeout=60
        )
        
        if success:
            print(f"   Generated DOCX: {response.get('file_url', '')}")
            print(f"   File Type: {response.get('file_type', 'Unknown')}")
            if response.get('file_type') == 'docx':
                print("   ✅ DOCX format confirmed")
            else:
                print(f"   ⚠️  Expected DOCX, got {response.get('file_type', 'Unknown')}")
        return success

    def test_audio_narration(self):
        """Test audio narration generation"""
        success, response = self.run_test(
            "Audio Narration Generation",
            "POST",
            "audio/generate",
            200,
            data={
                "prompt": "Narrate an introduction to GAAIUS AI and its capabilities",
                "duration": 10,
                "type": "narration"
            },
            timeout=60
        )
        
        if success:
            print(f"   Generated Audio: {response.get('audio_url', '')}")
            print(f"   Content: {response.get('content', '')[:100]}...")
            print(f"   Audio Type: {response.get('audio_type', 'Unknown')}")
        return success

    def test_projects_api(self):
        """Test Projects API functionality"""
        if not self.token:
            print("❌ No authentication token for projects test")
            return False

        # Test create project
        success, response = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data={
                "name": "Test Project",
                "description": "A test project for GAAIUS AI",
                "type": "web"
            }
        )
        
        if not success:
            return False
            
        project_id = response.get('id')
        print(f"   Created project: {project_id}")
        
        # Test list projects
        success, response = self.run_test(
            "List Projects",
            "GET",
            "projects",
            200
        )
        
        if success:
            print(f"   Found {len(response)} projects")
        
        # Test get specific project
        if project_id:
            success2, response2 = self.run_test(
                "Get Project Details",
                "GET",
                f"projects/{project_id}",
                200
            )
            
            if success2:
                print(f"   Project name: {response2.get('name', 'Unknown')}")
                print(f"   Project type: {response2.get('type', 'Unknown')}")
        
        return success

    def test_build_api(self):
        """Test Build/Code generation API"""
        success, response = self.run_test(
            "Build Code Generation",
            "POST",
            "build/generate",
            200,
            data={
                "prompt": "Create a simple React button component",
                "current_code": ""
            },
            timeout=60
        )
        
        if success:
            print(f"   Generated code length: {len(response.get('code', ''))}")
            print(f"   Model used: {response.get('model_used', 'Unknown')}")
            if 'React' in response.get('code', '') or 'button' in response.get('code', '').lower():
                print("   ✅ React component generated")
        return success

    def run_priority_tests(self):
        """Run all priority tests"""
        print("🚀 Starting GAAIUS AI Priority Feature Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)

        # Setup authentication
        if not self.setup_auth():
            print("❌ Authentication setup failed - cannot proceed with authenticated tests")
            return False

        # Test file generation features
        print("\n📄 Testing File Generation Features...")
        self.test_pdf_generation()
        self.test_docx_generation()
        
        # Test audio narration
        print("\n🎵 Testing Audio Narration...")
        self.test_audio_narration()
        
        # Test projects API
        print("\n📁 Testing Projects API...")
        self.test_projects_api()
        
        # Test build API
        print("\n🔨 Testing Build API...")
        self.test_build_api()

        # Print summary
        print("\n" + "=" * 60)
        print("📊 PRIORITY TESTS SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        if self.passed_tests:
            print("\n✅ PASSED TESTS:")
            for test in self.passed_tests:
                print(f"   • {test}")

        return len(self.failed_tests) == 0

def main():
    tester = PriorityTester()
    success = tester.run_priority_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
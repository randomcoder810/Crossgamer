#!/usr/bin/env python3
"""
Data Management Utility
Provides functions to view, search, and manage registration and contact data
"""

import json
import os
from datetime import datetime
from typing import List, Dict, Any

class DataManager:
    def __init__(self):
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_dir = os.path.join(script_dir, 'data')
        self.reg_file = os.path.join(self.data_dir, 'registrations.json')
        self.contact_file = os.path.join(self.data_dir, 'contacts.json')
        self.users_file = os.path.join(self.data_dir, 'users.json')
        

    
    def load_data(self, file_path: str) -> List[Dict[str, Any]]:
        """Load data from JSON file"""
        try:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return []
        except Exception as e:
            print(f"Error loading data from {file_path}: {e}")
            return []
    
    def save_data(self, file_path: str, data: List[Dict[str, Any]]) -> bool:
        """Save data to JSON file"""
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error saving data to {file_path}: {e}")
            return False
    
    def get_registrations(self) -> List[Dict[str, Any]]:
        """Get all registrations"""
        return self.load_data(self.reg_file)
    
    def get_contacts(self) -> List[Dict[str, Any]]:
        """Get all contacts"""
        return self.load_data(self.contact_file)

    # --- Users ---
    def get_users(self) -> List[Dict[str, Any]]:
        """Return all user records"""
        return self.load_data(self.users_file)

    def save_users(self, users: List[Dict[str, Any]]) -> bool:
        """Persist users list"""
        return self.save_data(self.users_file, users)

    def find_user_by_email(self, email: str) -> Dict[str, Any]:
        """Find a user by email (case-insensitive)."""
        email_l = (email or '').strip().lower()
        for u in self.get_users():
            if (u.get('email','').lower()) == email_l:
                return u
        return {}

    def create_user(self, name: str, email: str, password_hash: str) -> Dict[str, Any]:
        """Create and save a new user with an initial wallet of 0."""
        users = self.get_users()
        user = {
            'id': f"USR-{len(users)+1}",
            'name': name,
            'email': email.strip().lower(),
            'password_hash': password_hash,
            'wallet': {
                'balance': 0,
                'currency': 'INR',
                'updated_at': datetime.now().isoformat()
            },
            'created_at': datetime.now().isoformat(),
            'status': 'active'
        }
        users.append(user)
        if self.save_users(users):
            return user
        return {}

    def update_wallet(self, user_id: str, amount_delta: int) -> Dict[str, Any]:
        """Adjust wallet balance by amount_delta and persist."""
        users = self.get_users()
        for u in users:
            if u.get('id') == user_id:
                current = int(u.get('wallet', {}).get('balance', 0))
                u.setdefault('wallet', {})
                u['wallet']['balance'] = current + int(amount_delta)
                u['wallet']['updated_at'] = datetime.now().isoformat()
                if self.save_users(users):
                    return u
        return {}

    def set_wallet(self, user_id: str, new_balance: int) -> Dict[str, Any]:
        """Set wallet balance to new_balance and persist."""
        users = self.get_users()
        for u in users:
            if u.get('id') == user_id:
                u.setdefault('wallet', {})
                u['wallet']['balance'] = int(new_balance)
                u['wallet']['updated_at'] = datetime.now().isoformat()
                if self.save_users(users):
                    return u
        return {}
    
    def search_registrations(self, query: str) -> List[Dict[str, Any]]:
        """Search registrations by team name, player name, or email"""
        registrations = self.get_registrations()
        results = []
        query_lower = query.lower()
        
        for reg in registrations:
            # Search in team name
            if query_lower in reg.get('team_info', {}).get('name', '').lower():
                results.append(reg)
                continue
            
            # Search in player names
            for player in reg.get('players', []):
                if query_lower in player.get('name', '').lower():
                    results.append(reg)
                    break
            
            # Search in email
            if query_lower in reg.get('contact_info', {}).get('email', '').lower():
                results.append(reg)
                continue
        
        return results
    
    def get_registration_by_id(self, reg_id: str) -> Dict[str, Any]:
        """Get registration by ID"""
        registrations = self.get_registrations()
        for reg in registrations:
            if reg.get('registration_id') == reg_id:
                return reg
        return {}
    
    def update_registration_status(self, reg_id: str, status: str) -> bool:
        """Update registration status"""
        registrations = self.get_registrations()
        for reg in registrations:
            if reg.get('registration_id') == reg_id:
                reg['team_info']['status'] = status
                return self.save_data(self.reg_file, registrations)
        return False
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get registration statistics"""
        registrations = self.get_registrations()
        contacts = self.get_contacts()
        
        stats = {
            'total_registrations': len(registrations),
            'total_contacts': len(contacts),
            'status_breakdown': {},
            'recent_registrations': 0,
            'recent_contacts': 0
        }
        
        # Status breakdown
        for reg in registrations:
            status = reg.get('team_info', {}).get('status', 'unknown')
            stats['status_breakdown'][status] = stats['status_breakdown'].get(status, 0) + 1
        
        # Recent registrations (last 7 days)
        week_ago = datetime.now().timestamp() - (7 * 24 * 60 * 60)
        for reg in registrations:
            created_at = reg.get('team_info', {}).get('created_at', '')
            if created_at:
                try:
                    reg_time = datetime.fromisoformat(created_at.replace('Z', '+00:00')).timestamp()
                    if reg_time > week_ago:
                        stats['recent_registrations'] += 1
                except:
                    pass
        
        # Recent contacts (last 7 days)
        for contact in contacts:
            submitted_at = contact.get('meta', {}).get('submitted_at', '')
            if submitted_at:
                try:
                    contact_time = datetime.fromisoformat(submitted_at.replace('Z', '+00:00')).timestamp()
                    if contact_time > week_ago:
                        stats['recent_contacts'] += 1
                except:
                    pass
        
        return stats
    
    def export_to_csv(self, file_path: str, data_type: str = 'registrations') -> bool:
        """Export data to CSV format"""
        try:
            if data_type == 'registrations':
                data = self.get_registrations()
                filename = f"{file_path}_registrations.csv"
            else:
                data = self.get_contacts()
                filename = f"{file_path}_contacts.csv"
            
            import csv
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                if data_type == 'registrations':
                    fieldnames = [
                        'registration_id', 'team_name', 'status', 'category', 'tournament',
                        'player1', 'player2', 'player3', 'player4', 'player5',
                        'email', 'phone', 'primary_contact', 'created_at'
                    ]
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    
                    for reg in data:
                        row = {
                            'registration_id': reg.get('registration_id', ''),
                            'team_name': reg.get('team_info', {}).get('name', ''),
                            'status': reg.get('team_info', {}).get('status', ''),
                            'category': reg.get('team_info', {}).get('category', ''),
                            'tournament': reg.get('team_info', {}).get('tournament', ''),
                            'email': reg.get('contact_info', {}).get('email', ''),
                            'phone': reg.get('contact_info', {}).get('phone', ''),
                            'primary_contact': reg.get('contact_info', {}).get('primary_contact', ''),
                            'created_at': reg.get('team_info', {}).get('created_at', '')
                        }
                        
                        # Add player names
                        players = reg.get('players', [])
                        for i, player in enumerate(players[:5], 1):
                            row[f'player{i}'] = player.get('name', '')
                        
                        writer.writerow(row)
                else:
                    fieldnames = ['contact_id', 'name', 'email', 'message', 'submitted_at', 'status']
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    
                    for contact in data:
                        row = {
                            'contact_id': contact.get('contact_id', ''),
                            'name': contact.get('sender_info', {}).get('name', ''),
                            'email': contact.get('sender_info', {}).get('email', ''),
                            'message': contact.get('message', {}).get('content', ''),
                            'submitted_at': contact.get('meta', {}).get('submitted_at', ''),
                            'status': contact.get('meta', {}).get('status', '')
                        }
                        writer.writerow(row)
            
            print(f"Data exported to {filename}")
            return True
            
        except Exception as e:
            print(f"Error exporting data: {e}")
            return False

def main():
    """Main function for command-line interface"""
    manager = DataManager()
    
    while True:
        print("\n" + "="*50)
        print("BGMI Esports Data Manager")
        print("="*50)
        print("1. View all registrations")
        print("2. View all contacts")
        print("3. Search registrations")
        print("4. Get registration by ID")
        print("5. Update registration status")
        print("6. View statistics")
        print("7. Export to CSV")
        print("8. Exit")
        
        choice = input("\nEnter your choice (1-8): ").strip()
        
        if choice == '1':
            registrations = manager.get_registrations()
            print(f"\nTotal registrations: {len(registrations)}")
            for reg in registrations:
                print(f"\nID: {reg.get('registration_id')}")
                print(f"Team: {reg.get('team_info', {}).get('name')}")
                print(f"Status: {reg.get('team_info', {}).get('status')}")
                print(f"Email: {reg.get('contact_info', {}).get('email')}")
                print(f"Players: {', '.join([p.get('name') for p in reg.get('players', [])])}")
        
        elif choice == '2':
            contacts = manager.get_contacts()
            print(f"\nTotal contacts: {len(contacts)}")
            for contact in contacts:
                print(f"\nID: {contact.get('contact_id')}")
                print(f"Name: {contact.get('sender_info', {}).get('name')}")
                print(f"Email: {contact.get('sender_info', {}).get('email')}")
                print(f"Status: {contact.get('meta', {}).get('status')}")
        
        elif choice == '3':
            query = input("Enter search term: ").strip()
            results = manager.search_registrations(query)
            print(f"\nFound {len(results)} matching registrations:")
            for reg in results:
                print(f"- {reg.get('registration_id')}: {reg.get('team_info', {}).get('name')}")
        
        elif choice == '4':
            reg_id = input("Enter registration ID: ").strip()
            reg = manager.get_registration_by_id(reg_id)
            if reg:
                print(f"\nRegistration found:")
                print(json.dumps(reg, indent=2))
            else:
                print("Registration not found.")
        
        elif choice == '5':
            reg_id = input("Enter registration ID: ").strip()
            status = input("Enter new status (pending/approved/rejected): ").strip()
            if manager.update_registration_status(reg_id, status):
                print("Status updated successfully!")
            else:
                print("Failed to update status.")
        
        elif choice == '6':
            stats = manager.get_statistics()
            print(f"\nStatistics:")
            print(f"Total registrations: {stats['total_registrations']}")
            print(f"Total contacts: {stats['total_contacts']}")
            print(f"Recent registrations (7 days): {stats['recent_registrations']}")
            print(f"Recent contacts (7 days): {stats['recent_contacts']}")
            print(f"Status breakdown: {stats['status_breakdown']}")
        
        elif choice == '7':
            data_type = input("Export registrations or contacts? (r/c): ").strip().lower()
            if data_type in ['r', 'c']:
                filename = input("Enter base filename (without extension): ").strip()
                manager.export_to_csv(filename, 'registrations' if data_type == 'r' else 'contacts')
            else:
                print("Invalid choice.")
        
        elif choice == '8':
            print("Goodbye!")
            break
        
        else:
            print("Invalid choice. Please try again.")

if __name__ == '__main__':
    main() 
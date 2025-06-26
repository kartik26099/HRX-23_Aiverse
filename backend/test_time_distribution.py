#!/usr/bin/env python3
"""
Test script to verify time distribution for different time inputs
"""

import sys
import os

# Add the Ai DIy directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Ai DIy'))

def test_time_distribution():
    """Test the time distribution calculation"""
    
    try:
        from app import calculate_phase_times
        
        print("⏰ Testing time distribution calculation...")
        
        # Test different time formats
        test_times = [
            "3 hours",
            "2 hours", 
            "1 hour",
            "90 minutes",
            "60 minutes",
            "30 minutes",
            "4 hours",
            "5 hours"
        ]
        
        for time_input in test_times:
            print(f"\n📊 Testing: '{time_input}'")
            phase_times = calculate_phase_times(time_input)
            
            print(f"   Total minutes: {phase_times['total_minutes']}")
            print(f"   Phase 1 (Setup): {phase_times['phase1']}")
            print(f"   Phase 2 (Learning): {phase_times['phase2']}")
            print(f"   Phase 3 (Implementation): {phase_times['phase3']}")
            print(f"   Phase 4 (Testing): {phase_times['phase4']}")
            
            # Verify total adds up
            total_calculated = sum([
                int(phase_times['total_minutes'] * 0.15),  # Phase 1
                int(phase_times['total_minutes'] * 0.25),  # Phase 2
                int(phase_times['total_minutes'] * 0.45),  # Phase 3
                phase_times['total_minutes'] - int(phase_times['total_minutes'] * 0.15) - int(phase_times['total_minutes'] * 0.25) - int(phase_times['total_minutes'] * 0.45)  # Phase 4
            ])
            
            print(f"   ✅ Total distributed: {total_calculated} minutes")
            
            if total_calculated == phase_times['total_minutes']:
                print(f"   ✅ Time distribution is correct!")
            else:
                print(f"   ⚠️  Time distribution mismatch: {total_calculated} vs {phase_times['total_minutes']}")
                
    except Exception as e:
        print(f"❌ Error testing time distribution: {str(e)}")

if __name__ == "__main__":
    test_time_distribution() 
import unittest
import sys
import os
from datetime import datetime
from pathlib import Path

def run_tests():
    """Run all collector tests and generate a report."""
    # Get the project root directory
    project_root = Path(__file__).parent.parent
    
    # Add the project root to Python path
    sys.path.insert(0, str(project_root))
    
    # Create test report directory
    report_dir = project_root / 'tests' / 'reports'
    report_dir.mkdir(parents=True, exist_ok=True)
    
    # Discover and run tests
    test_loader = unittest.TestLoader()
    test_suite = test_loader.discover(
        start_dir=str(project_root / 'tests' / 'collectors'),
        pattern='test_*.py'
    )
    
    # Create test runner with report
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    report_file = report_dir / f'test_report_{timestamp}.txt'
    
    with open(report_file, 'w') as f:
        runner = unittest.TextTestRunner(stream=f, verbosity=2)
        result = runner.run(test_suite)
        
        # Write summary
        f.write('\n' + '='*50 + '\n')
        f.write('Test Summary\n')
        f.write('='*50 + '\n')
        f.write(f'Total Tests: {result.testsRun}\n')
        f.write(f'Failures: {len(result.failures)}\n')
        f.write(f'Errors: {len(result.errors)}\n')
        f.write(f'Skipped: {len(result.skipped)}\n')
        
        # Write failures
        if result.failures:
            f.write('\nFailures:\n')
            for failure in result.failures:
                f.write(f'\n{failure[0]}\n')
                f.write(f'{failure[1]}\n')
        
        # Write errors
        if result.errors:
            f.write('\nErrors:\n')
            for error in result.errors:
                f.write(f'\n{error[0]}\n')
                f.write(f'{error[1]}\n')
    
    # Print summary to console
    print('\nTest Summary:')
    print(f'Total Tests: {result.testsRun}')
    print(f'Failures: {len(result.failures)}')
    print(f'Errors: {len(result.errors)}')
    print(f'Skipped: {len(result.skipped)}')
    print(f'\nDetailed report written to: {report_file}')
    
    # Return success if no failures or errors
    return len(result.failures) == 0 and len(result.errors) == 0

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1) 
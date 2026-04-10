import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from ml.predict import predict_next_72h

__all__ = ['predict_next_72h']

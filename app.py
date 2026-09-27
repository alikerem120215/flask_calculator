import os
import math
import secrets
from flask import Flask, render_template, request, jsonify, session

app = Flask(__name__)
# Generate a secure secret key for sessions
app.secret_key = os.environ.get('FLASK_SECRET_KEY', secrets.token_hex(24))

# Safe mathematical symbols and functions whitelist
ALLOWED_NAMES = {
    'sin': math.sin,
    'cos': math.cos,
    'tan': math.tan,
    'sqrt': math.sqrt,
    'log': math.log10,  # standard log is base 10 for calculators
    'ln': math.log,     # natural log
    'pi': math.pi,
    'e': math.e,
    'abs': abs,
    'pow': pow
}

def safe_eval(expr):
    """
    Safely evaluate a mathematical expression using a whitelist of names
    and preventing arbitrary code execution.
    """
    # Clean expression and format operators
    expr = expr.replace('^', '**')
    expr = expr.replace('×', '*').replace('÷', '/')
    
    # Simple syntax check - ensure only safe characters are used
    allowed_chars = set("0123456789+-*/%.() ,abcdefghijklmnopqrstuvwxyz")
    if not set(expr.lower()).issubset(allowed_chars):
        raise ValueError("İfade izin verilmeyen karakterler içeriyor.")

    # Prevent double underscores or dangerous methods like __builtins__
    if "__" in expr:
        raise ValueError("Güvenlik ihlali tespit edildi.")

    # Evaluate in a restricted environment
    # eval() with no __builtins__ and only whitelisted functions/constants
    eval_globals = {"__builtins__": None}
    eval_globals.update(ALLOWED_NAMES)
    
    # We also allow standard math numbers
    try:
        # Evaluate
        result = eval(expr, eval_globals, {})
        
        # Check result type
        if isinstance(result, (int, float)):
            # Format float if it's an integer value, e.g., 5.0 -> 5
            if isinstance(result, float) and result.is_integer():
                return int(result)
            # Round float values to prevent floating-point precision issues like 0.1 + 0.2
            if isinstance(result, float):
                return round(result, 10)
            return result
        elif isinstance(result, complex):
            return str(result)
        else:
            raise ValueError("Geçersiz sonuç tipi.")
    except ZeroDivisionError:
        raise ZeroDivisionError("Sıfıra bölme hatası!")
    except Exception as e:
        raise ValueError("Hesaplama hatası. Lütfen ifadeyi kontrol edin.")

@app.route('/')
def index():
    # Initialize history in session if not present
    if 'history' not in session:
        session['history'] = []
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.get_json() or {}
    expr = data.get('expression', '').strip()
    
    if not expr:
        return jsonify({'success': False, 'error': 'İfade boş olamaz.'}), 400
        
    try:
        result = safe_eval(expr)
        
        # Save calculation to session history (keep last 10 calculations)
        if 'history' not in session:
            session['history'] = []
            
        history_item = {
            'expression': expr,
            'result': str(result)
        }
        
        # Avoid duplicating the last item
        history = session['history']
        if not history or history[-1] != history_item:
            history.append(history_item)
            if len(history) > 10:
                history.pop(0)
            session['history'] = history
            session.modified = True
            
        return jsonify({
            'success': True,
            'result': result,
            'history': session['history']
        })
        
    except ZeroDivisionError as e:
        return jsonify({'success': False, 'error': str(e)}), 200
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': 'Hesaplama hatası'}), 400

@app.route('/history', methods=['GET'])
def get_history():
    if 'history' not in session:
        session['history'] = []
    return jsonify({'success': True, 'history': session['history']})

@app.route('/history/clear', methods=['POST'])
def clear_history():
    session['history'] = []
    session.modified = True
    return jsonify({'success': True, 'message': 'Geçmiş başarıyla temizlendi.'})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)

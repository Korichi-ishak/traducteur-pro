#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Application Web - Traducteur Pro
Interface web mobile-friendly pour le traducteur Allemand ⇄ Français
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import sys
import re

# Importer les classes du script original
try:
    from deep_translator import GoogleTranslator
    from bs4 import BeautifulSoup
    import requests
except ImportError:
    print("⚠ Installation des dépendances...")
    import os
    os.system(f"{sys.executable} -m pip install flask flask-cors deep-translator beautifulsoup4 requests")
    from deep_translator import GoogleTranslator
    from bs4 import BeautifulSoup
    import requests

app = Flask(__name__)
CORS(app)

# Configuration
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,de;q=0.7',
}

LANG_MAP = {
    'de': {'name': 'Allemand', 'flag': '🇩🇪', 'pons': 'german', 'glosbe': 'de'},
    'fr': {'name': 'Français', 'flag': '🇫🇷', 'pons': 'french', 'glosbe': 'fr'},
}


class GoogleSource:
    """Google Translate."""
    def __init__(self):
        self._cache = {}

    def translate(self, text, src='de', tgt='fr'):
        key = (text, src, tgt)
        if key in self._cache:
            return self._cache[key]
        try:
            result = GoogleTranslator(source=src, target=tgt).translate(text)
            self._cache[key] = result
            return result
        except Exception as e:
            print(f"Erreur Google Translate: {e}")
            return None


class PONSSource:
    """PONS Dictionary."""
    def lookup(self, word, src='de', tgt='fr'):
        src_pons = LANG_MAP[src]['pons']
        tgt_pons = LANG_MAP[tgt]['pons']
        url = f"https://en.pons.com/translate/{src_pons}-{tgt_pons}/{requests.utils.quote(word)}"

        result = {'senses': [], 'phrases': []}

        try:
            r = requests.get(url, headers=HEADERS, timeout=10)
            if r.status_code != 200:
                return result

            r.encoding = r.apparent_encoding or 'utf-8'
            soup = BeautifulSoup(r.text, 'html.parser')

            for dl in soup.select('dl')[:15]:
                dt = dl.find('dt')
                dd = dl.find('dd')
                if not dt or not dd:
                    continue

                dt_text = dt.get_text(' ', strip=True)
                dd_text = dd.get_text(' ', strip=True)
                dd_text = re.sub(r'French\s*(\(Canada\))?\s*', '', dd_text).strip()

                sense_el = dt.select_one('.sense')
                if sense_el:
                    meaning = sense_el.get_text(' ', strip=True)
                    meaning = re.sub(r'([a-zäöüß])([A-ZÄÖÜ])', r'\1 \2', meaning)
                    result['senses'].append({
                        'meaning': meaning,
                        'translation': dd_text,
                    })
                elif len(dt_text) > 3:
                    result['phrases'].append({
                        'phrase': dt_text,
                        'translation': dd_text,
                    })
        except Exception as e:
            print(f"Erreur PONS: {e}")

        return result


class GlosbeSource:
    """Glosbe — exemples contextuels."""
    def lookup(self, word, src='de', tgt='fr'):
        url = f"https://glosbe.com/{src}/{tgt}/{requests.utils.quote(word)}"
        result = {'translations': [], 'examples': []}

        try:
            r = requests.get(url, headers=HEADERS, timeout=10)
            if r.status_code != 200:
                return result

            soup = BeautifulSoup(r.text, 'html.parser')

            # Traductions
            for h in soup.select('h3')[:8]:
                text = h.get_text(strip=True)
                if text and len(text) < 50:
                    result['translations'].append(text)

            # Exemples
            for ex in soup.select('.translation__example')[:6]:
                ps = ex.select('p')
                if len(ps) >= 2:
                    src_text = ps[0].get_text(' ', strip=True)
                    tgt_text = ps[1].get_text(' ', strip=True)
                    if src_text and tgt_text:
                        result['examples'].append({
                            'original': src_text,
                            'translation': tgt_text,
                        })
        except Exception as e:
            print(f"Erreur Glosbe: {e}")

        return result


class TraducteurPro:
    def __init__(self):
        self.google = GoogleSource()
        self.pons = PONSSource()
        self.glosbe = GlosbeSource()

    def traduire_mot(self, word, src='de', tgt='fr'):
        """Traduction complète d'un mot."""
        main_translation = self.google.translate(word, src, tgt)
        pons_data = self.pons.lookup(word, src, tgt)
        glosbe_data = self.glosbe.lookup(word, src, tgt)

        # Fusionner les traductions
        all_translations = []
        seen = set()
        sources = ([main_translation] if main_translation else []) + glosbe_data['translations']
        for t in sources:
            if t and t.lower() not in seen:
                seen.add(t.lower())
                all_translations.append(t)

        # Synonymes via traduction inverse
        synonyms = []
        for t in all_translations[:3]:
            try:
                reverse = self.google.translate(t, tgt, src)
                if reverse and reverse.lower() != word.lower():
                    if reverse.lower() not in {s.lower() for s in synonyms}:
                        synonyms.append(reverse)
            except:
                pass

        return {
            'word': word,
            'main_translation': main_translation or (all_translations[0] if all_translations else '?'),
            'translations': all_translations[:10],
            'senses': pons_data['senses'][:8],
            'phrases': pons_data['phrases'][:6],
            'examples': glosbe_data['examples'][:6],
            'synonyms': synonyms[:5],
            'src': src,
            'tgt': tgt,
        }

    def traduire_phrase(self, sentence, src='de', tgt='fr'):
        """Traduit une phrase complète."""
        translation = self.google.translate(sentence, src, tgt)

        # Vocabulaire mot à mot
        words = re.findall(r'\b\w+\b', sentence)
        word_by_word = {}
        for w in words:
            if len(w) > 2:
                wt = self.google.translate(w, src, tgt)
                if wt:
                    word_by_word[w] = wt

        return {
            'original': sentence,
            'translation': translation,
            'word_by_word': word_by_word,
            'src': src,
            'tgt': tgt,
        }


# Instancier le traducteur
translator = TraducteurPro()


# ─────────────────────────────────────────────────────────────
# Routes Flask
# ─────────────────────────────────────────────────────────────

@app.route('/')
def index():
    """Page d'accueil."""
    return render_template('index.html')


@app.route('/api/translate', methods=['POST'])
def translate():
    """API de traduction."""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        src = data.get('src', 'de')
        tgt = data.get('tgt', 'fr')
        mode = data.get('mode', 'word')  # 'word' ou 'sentence'

        if not text:
            return jsonify({'error': 'Texte vide'}), 400

        if mode == 'sentence' or len(text.split()) > 3:
            result = translator.traduire_phrase(text, src, tgt)
        else:
            result = translator.traduire_mot(text, src, tgt)

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/quick-translate', methods=['POST'])
def quick_translate():
    """Traduction rapide (Google uniquement)."""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        src = data.get('src', 'de')
        tgt = data.get('tgt', 'fr')

        if not text:
            return jsonify({'error': 'Texte vide'}), 400

        translation = translator.google.translate(text, src, tgt)
        return jsonify({
            'text': text,
            'translation': translation,
            'src': src,
            'tgt': tgt,
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("  🌍  TRADUCTEUR PRO - Interface Web")
    print("  Allemand ⇄ Français")
    print("=" * 60)
    print("\n  Accédez à l'application sur:")
    print(f"  • Ordinateur : http://localhost:5000")
    print(f"  • Téléphone  : http://<votre-ip-local>:5000")
    print("\n  Pour trouver votre IP locale:")
    print("  • Windows : ipconfig")
    print("  • Linux/Mac : ifconfig ou ip addr")
    print("\n" + "=" * 60 + "\n")
    
    # Démarrer le serveur sur toutes les interfaces pour permettre l'accès mobile
    app.run(host='0.0.0.0', port=5000, debug=True)

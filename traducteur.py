#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
╔══════════════════════════════════════════════════════════════╗
║          TRADUCTEUR PRO - Allemand ⇄ Français               ║
║       Style Reverso Context — 100% EN LIGNE                  ║
╚══════════════════════════════════════════════════════════════╝

Sources en ligne :
  • Google Translate  — traduction principale + phrases
  • PONS Dictionary   — définitions par sens, expressions idiomatiques
  • Glosbe            — exemples contextuels réels, traductions multiples

Fonctionnalités :
  1. Traduction de mots (détaillée avec sens, synonymes, exemples)
  2. Traduction de phrases complètes (+ analyse mot à mot)
  3. Historique persistant des traductions
  4. Mode révision (flashcards avec répétition espacée)
  5. Statistiques de progression
  6. Export du vocabulaire
  7. Recherche dans l'historique
"""

import json
import os
import random
import re
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

# ── Forcer UTF-8 sur Windows ──
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ── Dépendances ──────────────────────────────────────────────
try:
    import requests
    from bs4 import BeautifulSoup, Tag
    from deep_translator import GoogleTranslator, LingueeTranslator
    from colorama import init, Fore, Back, Style
    init(autoreset=True)
except ImportError:
    print("⚠ Installation des dépendances...")
    os.system(f"{sys.executable} -m pip install deep-translator colorama requests beautifulsoup4")
    import requests
    from bs4 import BeautifulSoup, Tag
    from deep_translator import GoogleTranslator, LingueeTranslator
    from colorama import init, Fore, Back, Style
    init(autoreset=True)

# ─────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
HISTORY_FILE = SCRIPT_DIR / "historique_traductions.json"
STATS_FILE = SCRIPT_DIR / "stats_revision.json"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,de;q=0.7',
}

LANG_MAP = {
    'de': {'name': 'Allemand', 'flag': '🇩🇪', 'pons': 'german', 'glosbe': 'de'},
    'fr': {'name': 'Français', 'flag': '🇫🇷', 'pons': 'french', 'glosbe': 'fr'},
}


# ─────────────────────────────────────────────────────────────
# Affichage
# ─────────────────────────────────────────────────────────────
def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')


def print_header():
    print(f"\n{Fore.CYAN}{'═' * 62}")
    print(f"{Fore.CYAN}║{Fore.YELLOW}  🌍  TRADUCTEUR PRO  —  Allemand ⇄ Français  {Fore.GREEN}[EN LIGNE]{Fore.CYAN}{'': >3}║")
    print(f"{Fore.CYAN}{'═' * 62}{Style.RESET_ALL}\n")


def print_section(title, color=Fore.GREEN):
    print(f"\n{color}┌{'─' * (len(title) + 2)}┐")
    print(f"│ {title} │")
    print(f"└{'─' * (len(title) + 2)}┘{Style.RESET_ALL}")


def print_menu():
    print(f"{Fore.CYAN}╔══════════════════════════════════════════════════╗")
    print(f"║  {Fore.YELLOW}[1]{Fore.WHITE} 📖  Traduire un mot (détaillé)              {Fore.CYAN}║")
    print(f"║  {Fore.YELLOW}[2]{Fore.WHITE} 💬  Traduire une phrase complète             {Fore.CYAN}║")
    print(f"║  {Fore.YELLOW}[3]{Fore.WHITE} 📚  Historique des traductions                {Fore.CYAN}║")
    print(f"║  {Fore.YELLOW}[4]{Fore.WHITE} 🧠  Mode révision (Flashcards)               {Fore.CYAN}║")
    print(f"║  {Fore.YELLOW}[5]{Fore.WHITE} 📊  Statistiques de progression               {Fore.CYAN}║")
    print(f"║  {Fore.YELLOW}[6]{Fore.WHITE} 💾  Exporter le vocabulaire                  {Fore.CYAN}║")
    print(f"║  {Fore.YELLOW}[7]{Fore.WHITE} 🔍  Rechercher dans l'historique              {Fore.CYAN}║")
    print(f"║  {Fore.YELLOW}[0]{Fore.WHITE} 👋  Quitter                                  {Fore.CYAN}║")
    print(f"╚══════════════════════════════════════════════════╝{Style.RESET_ALL}")


def spinner(msg):
    """Simple spinner indicator."""
    frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    sys.stdout.write(f"\r  {Fore.YELLOW}{random.choice(frames)} {msg}{Style.RESET_ALL}")
    sys.stdout.flush()


# ─────────────────────────────────────────────────────────────
# Détection de langue
# ─────────────────────────────────────────────────────────────
def detect_language(text):
    """Détecte si le texte est en allemand ou français."""
    german_words = {
        'der', 'die', 'das', 'ein', 'eine', 'und', 'ist', 'nicht', 'ich',
        'du', 'er', 'sie', 'wir', 'ihr', 'mit', 'von', 'auf', 'für', 'aber',
        'auch', 'noch', 'nach', 'bei', 'dem', 'den', 'des', 'sich', 'es',
        'haben', 'sein', 'werden', 'kann', 'hat', 'sind', 'war', 'wenn',
        'nur', 'wie', 'so', 'als', 'oder', 'diese', 'einem', 'einer',
    }
    french_words = {
        'le', 'la', 'les', 'un', 'une', 'des', 'est', 'sont', 'je', 'tu',
        'il', 'elle', 'nous', 'vous', 'ils', 'avec', 'pour', 'dans', 'sur',
        'pas', 'mais', 'ou', 'que', 'qui', 'ce', 'cette', 'aux', 'du',
        'être', 'avoir', 'fait', 'très', 'bien', 'tout', 'plus', 'comme',
        'aussi', 'même', 'entre', 'après', 'sans', 'chez', 'peu',
    }

    text_lower = text.lower()
    words = set(re.findall(r'\b\w+\b', text_lower))

    de_score = len(words & german_words)
    fr_score = len(words & french_words)

    # Bonus for special chars
    de_score += sum(1 for c in 'äöüß' if c in text_lower)
    fr_score += sum(1 for c in 'éèêëçàùîôû' if c in text_lower)

    if de_score > fr_score:
        return 'de', 'fr'
    elif fr_score > de_score:
        return 'fr', 'de'
    return None, None


def ask_direction():
    """Demande la direction de traduction."""
    print(f"\n{Fore.YELLOW}  Direction de traduction :")
    print(f"  {Fore.WHITE}[1] Allemand → Français  🇩🇪 → 🇫🇷")
    print(f"  {Fore.WHITE}[2] Français → Allemand  🇫🇷 → 🇩🇪")
    choice = input(f"\n  {Fore.CYAN}Choix (1/2) : {Style.RESET_ALL}").strip()
    if choice == '2':
        return 'fr', 'de'
    return 'de', 'fr'


# ─────────────────────────────────────────────────────────────
# Historique & Stats (persistance JSON)
# ─────────────────────────────────────────────────────────────
def load_json(path):
    if path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return [] if 'historique' in path.name else {}


def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_history():
    return load_json(HISTORY_FILE)


def save_history(history):
    save_json(HISTORY_FILE, history)


def add_to_history(word, result):
    """Ajoute/met à jour un mot dans l'historique."""
    history = load_history()

    # Vérifier si le mot existe déjà
    for entry in history:
        if entry['word'].lower() == word.lower() and entry['src_lang'] == result['src']:
            entry['lookup_count'] += 1
            entry['last_lookup'] = datetime.now().isoformat()
            save_history(history)
            return

    entry = {
        'word': word,
        'main_translation': result.get('main_translation', ''),
        'translations': result.get('all_translations', []),
        'senses': result.get('senses', []),
        'synonyms': result.get('synonyms_src', []) + result.get('synonyms_tgt', []),
        'examples': result.get('examples', [])[:8],
        'phrases': result.get('phrases', [])[:6],
        'src_lang': result['src'],
        'tgt_lang': result['tgt'],
        'date_added': datetime.now().isoformat(),
        'last_lookup': datetime.now().isoformat(),
        'lookup_count': 1,
        'revision_score': 0,
        'next_revision': datetime.now().isoformat(),
        'times_correct': 0,
        'times_incorrect': 0,
    }
    history.append(entry)
    save_history(history)


def load_stats():
    data = load_json(STATS_FILE)
    if not data:
        data = {
            'total_sessions': 0,
            'total_words_reviewed': 0,
            'total_correct': 0,
            'total_incorrect': 0,
            'streak_days': 0,
            'last_session': None,
        }
    return data


def save_stats(stats):
    save_json(STATS_FILE, stats)


# ─────────────────────────────────────────────────────────────
# Sources EN LIGNE
# ─────────────────────────────────────────────────────────────

class GoogleSource:
    """Google Translate — traduction rapide et fiable."""

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
        except Exception:
            return None


class LingueeSource:
    """Linguee — traductions multiples d'un mot."""

    def get_translations(self, word, src='de', tgt='fr'):
        try:
            translator = LingueeTranslator(source=src, target=tgt)
            results = translator.translate(word)
            if isinstance(results, list):
                return results
            return [results] if results else []
        except Exception:
            return []


class PONSSource:
    """PONS Dictionary — définitions par sens et expressions idiomatiques."""

    def lookup(self, word, src='de', tgt='fr'):
        src_pons = LANG_MAP[src]['pons']
        tgt_pons = LANG_MAP[tgt]['pons']
        url = f"https://en.pons.com/translate/{src_pons}-{tgt_pons}/{requests.utils.quote(word)}"

        result = {'senses': [], 'phrases': []}

        try:
            r = requests.get(url, headers=HEADERS, timeout=10)
            if r.status_code != 200:
                return result

            # PONS envoie parfois du latin-1 mal déclaré
            r.encoding = r.apparent_encoding or 'utf-8'
            soup = BeautifulSoup(r.text, 'html.parser')

            for dl in soup.select('dl'):
                dt = dl.find('dt')
                dd = dl.find('dd')
                if not dt or not dd:
                    continue

                dt_text = dt.get_text(' ', strip=True)
                dd_text = dd.get_text(' ', strip=True)
                # Nettoyer les marqueurs "French French (Canada)"
                dd_text = re.sub(r'French\s*(\(Canada\))?\s*', '', dd_text).strip()

                sense_el = dt.select_one('.sense')
                if sense_el:
                    # Ajouter des espaces entre mots collés : (mehrstöckigesWohnhaus) -> (mehrstöckiges Wohnhaus)
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
        except Exception:
            pass

        return result


class GlosbeSource:
    """Glosbe — exemples contextuels réels tirés de vrais textes."""

    def lookup(self, word, src='de', tgt='fr'):
        url = f"https://glosbe.com/{src}/{tgt}/{requests.utils.quote(word)}"
        result = {'translations': [], 'definitions': [], 'examples': []}

        try:
            r = requests.get(url, headers=HEADERS, timeout=10)
            if r.status_code != 200:
                return result

            soup = BeautifulSoup(r.text, 'html.parser')

            # Traductions principales (h3 tags)
            for h in soup.select('h3')[:10]:
                text = h.get_text(strip=True)
                if text and len(text) < 50:
                    result['translations'].append(text)

            # Définitions : extraire seulement le texte de définition des <li>
            for li in soup.select('li')[:25]:
                text = li.get_text(' ', strip=True)
                # Chercher le pattern : mot_type + feminine/masculine + définition
                match = re.match(
                    r'^(\w+)\s*(noun|verb|adjective|adverb)\s*(masculine|feminine|neuter)?\s*(.+)',
                    text, re.IGNORECASE
                )
                if match:
                    word_type = match.group(2)
                    gender = match.group(3) or ''
                    definition = match.group(4).strip()
                    # Garder seulement la première phrase de la définition
                    definition = re.split(r'[.!]', definition)[0].strip()
                    if definition and 5 < len(definition) < 120:
                        label = f"{word_type}"
                        if gender:
                            label += f", {gender}"
                        result['definitions'].append({
                            'type': label,
                            'definition': definition,
                        })

            # Exemples contextuels réels
            for ex in soup.select('.translation__example')[:10]:
                ps = ex.select('p')
                if len(ps) >= 2:
                    src_text = ps[0].get_text(' ', strip=True)
                    tgt_text = ps[1].get_text(' ', strip=True)
                    if src_text and tgt_text:
                        result['examples'].append({
                            'original': src_text,
                            'translation': tgt_text,
                        })
        except Exception:
            pass

        return result


# ─────────────────────────────────────────────────────────────
# Moteur de traduction (agrégation multi-sources)
# ─────────────────────────────────────────────────────────────

class TraducteurPro:
    def __init__(self):
        self.google = GoogleSource()
        self.linguee = LingueeSource()
        self.pons = PONSSource()
        self.glosbe = GlosbeSource()

    def traduire_mot(self, word, src='de', tgt='fr'):
        """Traduction complète d'un mot — 4 sources en ligne."""
        spinner("Google Translate...")
        main_translation = self.google.translate(word, src, tgt)

        spinner("Linguee...")
        linguee_trans = self.linguee.get_translations(word, src, tgt)

        spinner("PONS Dictionary...")
        pons_data = self.pons.lookup(word, src, tgt)

        spinner("Glosbe (exemples contextuels)...")
        glosbe_data = self.glosbe.lookup(word, src, tgt)

        # ── Fusionner les traductions (dédupliquer) ──
        all_translations = []
        seen = set()
        sources = ([main_translation] if main_translation else []) + linguee_trans + glosbe_data['translations']
        for t in sources:
            if t and t.lower() not in seen:
                seen.add(t.lower())
                all_translations.append(t)

        # ── Synonymes via traduction inverse ──
        synonyms_src = []
        for t in all_translations[:5]:
            try:
                reverse = self.google.translate(t, tgt, src)
                if reverse and reverse.lower() != word.lower():
                    if reverse.lower() not in {s.lower() for s in synonyms_src}:
                        synonyms_src.append(reverse)
            except Exception:
                pass

        print(f"\r  {Fore.GREEN}✓ Données agrégées de 4 sources en ligne.{Style.RESET_ALL}          ")

        return {
            'word': word,
            'main_translation': main_translation or (all_translations[0] if all_translations else '?'),
            'all_translations': all_translations,
            'senses': pons_data['senses'],
            'phrases': pons_data['phrases'],
            'definitions': glosbe_data['definitions'],
            'examples': glosbe_data['examples'],
            'synonyms_src': synonyms_src,
            'synonyms_tgt': all_translations[1:] if len(all_translations) > 1 else [],
            'src': src,
            'tgt': tgt,
        }

    def traduire_phrase(self, sentence, src=None, tgt=None):
        """Traduit une phrase complète avec analyse mot à mot."""
        if src is None:
            src, tgt = detect_language(sentence)
            if src is None:
                src, tgt = ask_direction()

        spinner("Traduction de la phrase...")
        translation = self.google.translate(sentence, src, tgt)

        # Vocabulaire mot à mot
        words = re.findall(r'\b\w+\b', sentence)
        word_by_word = {}
        for w in words:
            if len(w) > 2:
                wt = self.google.translate(w, src, tgt)
                if wt:
                    word_by_word[w] = wt

        print(f"\r  {Fore.GREEN}✓ Traduction terminée.{Style.RESET_ALL}                          ")

        return {
            'original': sentence,
            'translation': translation,
            'src': src,
            'tgt': tgt,
            'word_by_word': word_by_word,
        }


# ─────────────────────────────────────────────────────────────
# Affichage des résultats
# ─────────────────────────────────────────────────────────────

def display_word_result(result):
    """Affiche le résultat détaillé d'une traduction de mot."""
    src = result['src']
    tgt = result['tgt']
    sf = LANG_MAP[src]['flag']
    tf = LANG_MAP[tgt]['flag']
    sn = LANG_MAP[src]['name']
    tn = LANG_MAP[tgt]['name']

    # En-tête
    print(f"\n{Fore.CYAN}{'━' * 62}")
    print(f"  {sf}  {Fore.YELLOW}{Style.BRIGHT}{result['word']}{Style.RESET_ALL}  →  "
          f"{tf}  {Fore.GREEN}{Style.BRIGHT}{result['main_translation']}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'━' * 62}")

    # ── Toutes les traductions ──
    if result['all_translations']:
        print_section(f"📖 Traductions ({tn})")
        for i, t in enumerate(result['all_translations'][:12], 1):
            marker = "●" if i == 1 else "○"
            color = Fore.GREEN if i == 1 else Fore.WHITE
            print(f"    {color}{marker} {t}{Style.RESET_ALL}")

    # ── Significations / Sens (PONS) ──
    if result['senses']:
        print_section("🎯 Significations par sens (PONS)")
        for s in result['senses'][:10]:
            print(f"    {Fore.YELLOW}{s['meaning']}{Style.RESET_ALL}")
            print(f"      → {Fore.GREEN}{s['translation']}{Style.RESET_ALL}")

    # ── Définitions (Glosbe) ──
    if result['definitions']:
        print_section("📝 Définitions")
        for d in result['definitions'][:6]:
            print(f"    {Fore.CYAN}[{d['type']}]{Fore.WHITE} {d['definition']}{Style.RESET_ALL}")

    # ── Synonymes langue source ──
    if result['synonyms_src']:
        print_section(f"🔄 Mots proches ({sn})")
        for s in result['synonyms_src'][:6]:
            print(f"    {Fore.MAGENTA}≈ {s}{Style.RESET_ALL}")

    # ── Synonymes langue cible ──
    if result['synonyms_tgt']:
        print_section(f"🔄 Synonymes ({tn})")
        for s in result['synonyms_tgt'][:8]:
            print(f"    {Fore.MAGENTA}≈ {s}{Style.RESET_ALL}")

    # ── Expressions & Locutions (PONS) ──
    if result['phrases']:
        print_section("💡 Expressions & Locutions (PONS)")
        for p in result['phrases'][:10]:
            print(f"    {sf} {Fore.WHITE}{p['phrase']}{Style.RESET_ALL}")
            print(f"       {tf} {Fore.GREEN}{p['translation']}{Style.RESET_ALL}")

    # ── Exemples contextuels réels (Glosbe) ──
    if result['examples']:
        print_section("💬 Exemples en contexte (phrases réelles — Glosbe)")
        for i, ex in enumerate(result['examples'][:10], 1):
            print(f"\n    {Fore.YELLOW}({i}) {sf}  {ex['original']}")
            print(f"        {tf}  {Fore.GREEN}{ex['translation']}{Style.RESET_ALL}")

    # Sources
    print(f"\n{Fore.CYAN}{'─' * 62}")
    src_list = []
    if result.get('main_translation'):
        src_list.append("Google Translate")
    if result.get('all_translations'):
        src_list.append("Linguee")
    if result.get('senses') or result.get('phrases'):
        src_list.append("PONS")
    if result.get('examples') or result.get('definitions'):
        src_list.append("Glosbe")
    print(f"  {Fore.WHITE}Sources : {Fore.CYAN}{' • '.join(src_list)}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'━' * 62}{Style.RESET_ALL}")


def display_sentence_result(result):
    """Affiche le résultat d'une traduction de phrase."""
    sf = LANG_MAP[result['src']]['flag']
    tf = LANG_MAP[result['tgt']]['flag']

    print(f"\n{Fore.CYAN}{'━' * 62}")
    print(f"  {Fore.YELLOW}TRADUCTION DE PHRASE")
    print(f"{Fore.CYAN}{'━' * 62}")

    print(f"\n  {sf}  {Fore.WHITE}{Style.BRIGHT}{result['original']}{Style.RESET_ALL}")
    print(f"\n  {tf}  {Fore.GREEN}{Style.BRIGHT}{result['translation']}{Style.RESET_ALL}")

    if result['word_by_word']:
        print_section("📝 Vocabulaire (mot à mot)")
        max_w = max(len(w) for w in result['word_by_word'])
        for w, t in result['word_by_word'].items():
            print(f"    {Fore.YELLOW}{w:<{max_w}}{Fore.WHITE}  →  {Fore.GREEN}{t}{Style.RESET_ALL}")

    print(f"\n{Fore.CYAN}{'━' * 62}{Style.RESET_ALL}")


# ─────────────────────────────────────────────────────────────
# Menu : Historique, Révision, Stats, Export, Recherche
# ─────────────────────────────────────────────────────────────

def show_history():
    history = load_history()
    if not history:
        print(f"\n  {Fore.YELLOW}📭 Aucun mot dans l'historique.{Style.RESET_ALL}")
        return

    print_section(f"📚 Historique — {len(history)} mots")
    print(f"\n  {Fore.WHITE}{'N°':<4} {'Mot':<20} {'Traduction':<20} {'Dir.':<8} {'×':<4} {'Niveau'}")
    print(f"  {Fore.CYAN}{'─' * 62}")

    for i, entry in enumerate(reversed(history[-50:]), 1):
        sf = LANG_MAP[entry['src_lang']]['flag']
        tf = LANG_MAP[entry['tgt_lang']]['flag']
        direction = f"{sf}→{tf}"
        main_trans = entry.get('main_translation', entry.get('translations', ['?'])[0] if entry.get('translations') else '?')
        score = entry.get('revision_score', 0)
        bar = '★' * score + '☆' * (5 - score)
        print(f"  {Fore.YELLOW}{i:<4}{Fore.WHITE}{entry['word']:<20}{Fore.GREEN}"
              f"{str(main_trans)[:18]:<20}{Fore.CYAN}{direction:<8}"
              f"{Fore.MAGENTA}{entry.get('lookup_count', 1):<4}{Fore.YELLOW}{bar}{Style.RESET_ALL}")


def search_history():
    query = input(f"\n  {Fore.CYAN}🔍 Rechercher : {Style.RESET_ALL}").strip().lower()
    if not query:
        return

    history = load_history()
    results = []
    for e in history:
        if query in e['word'].lower():
            results.append(e)
            continue
        if query in e.get('main_translation', '').lower():
            results.append(e)
            continue
        if any(query in t.lower() for t in e.get('translations', [])):
            results.append(e)

    if not results:
        print(f"\n  {Fore.YELLOW}Aucun résultat pour « {query} ».{Style.RESET_ALL}")
        return

    print(f"\n  {Fore.GREEN}✅ {len(results)} résultat(s) :{Style.RESET_ALL}\n")
    for entry in results:
        sf = LANG_MAP[entry['src_lang']]['flag']
        tf = LANG_MAP[entry['tgt_lang']]['flag']
        trans = entry.get('main_translation', '')
        print(f"    {sf} {Fore.YELLOW}{entry['word']}{Fore.WHITE} → {tf} {Fore.GREEN}{trans}{Style.RESET_ALL}")
        if entry.get('senses'):
            for s in entry['senses'][:2]:
                print(f"       {Fore.CYAN}{s.get('meaning', '')}{Fore.WHITE} : {s.get('translation', '')}{Style.RESET_ALL}")
        if entry.get('examples'):
            ex = entry['examples'][0]
            print(f"       {Fore.WHITE}💬 {ex.get('original', '')}{Style.RESET_ALL}")
        print()


def revision_mode():
    """Mode révision par flashcards avec répétition espacée."""
    history = load_history()
    if len(history) < 3:
        print(f"\n  {Fore.YELLOW}⚠ Il faut au moins 3 mots dans l'historique pour la révision.{Style.RESET_ALL}")
        return

    stats = load_stats()
    stats['total_sessions'] += 1
    now = datetime.now()

    # Mots à réviser (priorité : score bas + date due)
    revision_words = []
    for entry in history:
        next_rev = datetime.fromisoformat(entry.get('next_revision', now.isoformat()))
        if next_rev <= now:
            revision_words.append(entry)

    if not revision_words:
        revision_words = sorted(history, key=lambda x: x.get('revision_score', 0))[:10]

    random.shuffle(revision_words)
    revision_words = revision_words[:15]

    print(f"\n{Fore.CYAN}{'═' * 62}")
    print(f"  {Fore.YELLOW}🧠  MODE RÉVISION  —  {len(revision_words)} mots")
    print(f"{Fore.CYAN}{'═' * 62}")
    print(f"\n  {Fore.WHITE}Traduisez chaque mot. Commandes :")
    print(f"    {Fore.CYAN}?{Fore.WHITE} = indice  |  {Fore.CYAN}s{Fore.WHITE} = passer  |  {Fore.CYAN}q{Fore.WHITE} = quitter\n")

    correct = 0
    incorrect = 0
    total = 0

    for i, entry in enumerate(revision_words, 1):
        sf = LANG_MAP[entry['src_lang']]['flag']
        tn = LANG_MAP[entry['tgt_lang']]['name']
        score = entry.get('revision_score', 0)
        bar = '★' * score + '☆' * (5 - score)

        print(f"\n  {Fore.CYAN}[{i}/{len(revision_words)}]  Niveau : {Fore.YELLOW}{bar}{Style.RESET_ALL}")
        print(f"  {sf}  Comment dit-on {Fore.YELLOW}{Style.BRIGHT}« {entry['word']} »{Style.RESET_ALL} {Fore.WHITE}en {tn} ?")

        # Indice contextuel si dispo
        if entry.get('senses'):
            hint_sense = entry['senses'][0].get('meaning', '')
            if hint_sense:
                print(f"     {Fore.WHITE}(sens : {hint_sense}){Style.RESET_ALL}")

        answer = input(f"\n  {Fore.GREEN}→ {Style.RESET_ALL}").strip()

        if answer.lower() == 'q':
            break

        if answer == '?':
            trans = entry.get('main_translation', '')
            if not trans and entry.get('translations'):
                trans = entry['translations'][0]
            if trans:
                masked = trans[0] + '_' * (len(trans) - 2) + (trans[-1] if len(trans) > 2 else '')
                print(f"  {Fore.CYAN}💡 {masked}  ({len(trans)} lettres){Style.RESET_ALL}")
            answer = input(f"  {Fore.GREEN}→ {Style.RESET_ALL}").strip()

        if answer.lower() == 's':
            trans = entry.get('main_translation', '')
            extras = entry.get('translations', [])[:3]
            print(f"  {Fore.YELLOW}⏭  Réponse : {Fore.GREEN}{trans}")
            if extras:
                print(f"     {Fore.WHITE}Aussi : {', '.join(extras[:3])}{Style.RESET_ALL}")
            continue

        total += 1

        # Vérifier la réponse
        correct_answers = set()
        if entry.get('main_translation'):
            correct_answers.add(entry['main_translation'].lower().strip())
        for t in entry.get('translations', []):
            correct_answers.add(t.lower().strip())

        user_answer = answer.lower().strip()
        is_correct = user_answer in correct_answers

        # Tolérance : sous-chaîne
        if not is_correct:
            for ca in correct_answers:
                if (user_answer in ca or ca in user_answer) and len(user_answer) > 2:
                    is_correct = True
                    break

        if is_correct:
            correct += 1
            entry['times_correct'] = entry.get('times_correct', 0) + 1
            entry['revision_score'] = min(5, entry.get('revision_score', 0) + 1)
            days = [1, 2, 4, 7, 14, 30][min(entry['revision_score'], 5)]
            entry['next_revision'] = (now + timedelta(days=days)).isoformat()

            print(f"  {Fore.GREEN}✅ Correct !{Style.RESET_ALL}")
            extras = [t for t in entry.get('translations', [])[:4] if t.lower() != user_answer]
            if extras:
                print(f"     {Fore.WHITE}Autres : {Fore.CYAN}{', '.join(extras)}{Style.RESET_ALL}")
        else:
            incorrect += 1
            entry['times_incorrect'] = entry.get('times_incorrect', 0) + 1
            entry['revision_score'] = max(0, entry.get('revision_score', 0) - 1)
            entry['next_revision'] = now.isoformat()

            trans = entry.get('main_translation', '')
            print(f"  {Fore.RED}❌ La réponse était : {Fore.GREEN}{trans}{Style.RESET_ALL}")
            extras = entry.get('translations', [])[:3]
            if extras:
                print(f"     {Fore.WHITE}Aussi : {', '.join(extras)}{Style.RESET_ALL}")

        # Montrer un exemple contextuel
        if entry.get('examples'):
            ex = random.choice(entry['examples'])
            print(f"     {Fore.WHITE}💬 {ex.get('original', '')}")
            print(f"        {Fore.CYAN}{ex.get('translation', '')}{Style.RESET_ALL}")

    save_history(history)

    stats['total_words_reviewed'] += total
    stats['total_correct'] += correct
    stats['total_incorrect'] += incorrect
    stats['last_session'] = now.isoformat()
    save_stats(stats)

    # Résumé
    print(f"\n{Fore.CYAN}{'═' * 62}")
    print(f"  {Fore.YELLOW}📊  RÉSUMÉ DE LA SESSION")
    print(f"{Fore.CYAN}{'═' * 62}")
    if total > 0:
        pct = (correct / total) * 100
        filled = int(30 * correct / total)
        bar = '█' * filled + '░' * (30 - filled)
        color = Fore.GREEN if pct >= 70 else Fore.YELLOW if pct >= 50 else Fore.RED
        print(f"\n  {Fore.WHITE}Mots révisés : {Fore.YELLOW}{total}")
        print(f"  {Fore.GREEN}✅ Corrects   : {correct}")
        print(f"  {Fore.RED}❌ Incorrects : {incorrect}")
        print(f"\n  {color}  [{bar}] {pct:.0f}%{Style.RESET_ALL}")
        if pct == 100:
            print(f"\n  {Fore.GREEN}🌟 Parfait ! Excellent travail !{Style.RESET_ALL}")
        elif pct >= 70:
            print(f"\n  {Fore.GREEN}👍 Bien joué !{Style.RESET_ALL}")
        elif pct >= 50:
            print(f"\n  {Fore.YELLOW}📝 Continue, tu progresses !{Style.RESET_ALL}")
        else:
            print(f"\n  {Fore.RED}💪 Courage ! Révise régulièrement.{Style.RESET_ALL}")
    print()


def show_stats():
    stats = load_stats()
    history = load_history()

    print_section("📊 Statistiques globales")
    print(f"\n  {Fore.WHITE}Sessions de révision  : {Fore.YELLOW}{stats.get('total_sessions', 0)}")
    print(f"  {Fore.WHITE}Mots révisés (total)  : {Fore.YELLOW}{stats.get('total_words_reviewed', 0)}")
    print(f"  {Fore.WHITE}Réponses correctes    : {Fore.GREEN}{stats.get('total_correct', 0)}")
    print(f"  {Fore.WHITE}Réponses incorrectes  : {Fore.RED}{stats.get('total_incorrect', 0)}")

    t = stats.get('total_correct', 0) + stats.get('total_incorrect', 0)
    if t > 0:
        pct = (stats['total_correct'] / t) * 100
        print(f"  {Fore.WHITE}Taux de réussite      : {Fore.GREEN}{pct:.1f}%")

    print(f"\n  {Fore.WHITE}Mots dans l'historique : {Fore.YELLOW}{len(history)}")

    if stats.get('last_session'):
        last = datetime.fromisoformat(stats['last_session'])
        print(f"  {Fore.WHITE}Dernière session       : {Fore.CYAN}{last.strftime('%d/%m/%Y à %H:%M')}")

    if history:
        top = sorted(history, key=lambda x: x.get('lookup_count', 0), reverse=True)[:5]
        print(f"\n  {Fore.YELLOW}🏆 Top 5 des mots les plus recherchés :")
        for i, e in enumerate(top, 1):
            print(f"    {Fore.WHITE}{i}. {Fore.YELLOW}{e['word']}{Fore.WHITE} ({e.get('lookup_count', 1)}×)")

        difficult = [e for e in history if e.get('times_incorrect', 0) > e.get('times_correct', 0)]
        if difficult:
            print(f"\n  {Fore.RED}⚠ Mots à travailler :")
            for e in difficult[:5]:
                print(f"    {Fore.WHITE}• {Fore.RED}{e['word']}{Fore.WHITE} "
                      f"(❌{e.get('times_incorrect', 0)} / ✅{e.get('times_correct', 0)})")

        mastered = [e for e in history if e.get('revision_score', 0) >= 4]
        if mastered:
            print(f"\n  {Fore.GREEN}🌟 Mots maîtrisés ({len(mastered)}) :")
            for e in mastered[:8]:
                print(f"    {Fore.GREEN}✓ {e['word']}{Style.RESET_ALL}")


def export_history():
    history = load_history()
    if not history:
        print(f"\n  {Fore.YELLOW}📭 Historique vide.{Style.RESET_ALL}")
        return

    export_file = SCRIPT_DIR / f"export_vocabulaire_{datetime.now().strftime('%Y%m%d_%H%M')}.txt"

    with open(export_file, 'w', encoding='utf-8') as f:
        f.write("═" * 60 + "\n")
        f.write("   VOCABULAIRE ALLEMAND ⇄ FRANÇAIS\n")
        f.write(f"   Exporté le {datetime.now().strftime('%d/%m/%Y à %H:%M')}\n")
        f.write("═" * 60 + "\n\n")

        for src_code, tgt_code, label in [('de', 'fr', 'ALLEMAND → FRANÇAIS'), ('fr', 'de', 'FRANÇAIS → ALLEMAND')]:
            entries = [e for e in history if e['src_lang'] == src_code]
            if not entries:
                continue

            f.write(f"{'─' * 40}\n  {label}\n{'─' * 40}\n\n")

            for entry in entries:
                main = entry.get('main_translation', '')
                f.write(f"  ● {entry['word']}  →  {main}\n")

                if entry.get('senses'):
                    for s in entry['senses'][:3]:
                        f.write(f"      {s.get('meaning', '')} : {s.get('translation', '')}\n")

                if entry.get('translations'):
                    others = [t for t in entry['translations'][:5] if t != main]
                    if others:
                        f.write(f"      Aussi : {', '.join(others)}\n")

                if entry.get('phrases'):
                    for p in entry['phrases'][:2]:
                        f.write(f"      → {p.get('phrase', '')} = {p.get('translation', '')}\n")

                if entry.get('examples'):
                    for ex in entry['examples'][:2]:
                        f.write(f"      💬 {ex.get('original', '')}\n")
                        f.write(f"         {ex.get('translation', '')}\n")

                score = entry.get('revision_score', 0)
                f.write(f"      Niveau : {'★' * score}{'☆' * (5 - score)}  "
                        f"(recherché {entry.get('lookup_count', 1)}×)\n\n")

        f.write(f"\nTotal : {len(history)} mots\n")

    print(f"\n  {Fore.GREEN}✅ Exporté vers : {Fore.WHITE}{export_file}{Style.RESET_ALL}")


# ─────────────────────────────────────────────────────────────
# Boucle principale
# ─────────────────────────────────────────────────────────────

def main():
    traducteur = TraducteurPro()
    clear_screen()
    print_header()

    while True:
        print_menu()
        choice = input(f"\n  {Fore.CYAN}▶ Votre choix : {Style.RESET_ALL}").strip()

        if choice == '1':
            src, tgt = ask_direction()
            src_label = LANG_MAP[src]['name'].lower()
            word = input(f"\n  {Fore.CYAN}📝 Mot en {src_label} : {Style.RESET_ALL}").strip()
            if not word:
                continue
            print()
            result = traducteur.traduire_mot(word, src, tgt)
            display_word_result(result)
            add_to_history(word, result)
            print(f"  {Fore.GREEN}💾 Sauvegardé dans l'historique.{Style.RESET_ALL}")

        elif choice == '2':
            print(f"\n  {Fore.WHITE}(La langue est détectée automatiquement)")
            sentence = input(f"  {Fore.CYAN}📝 Phrase : {Style.RESET_ALL}").strip()
            if not sentence:
                continue
            print()
            result = traducteur.traduire_phrase(sentence)
            display_sentence_result(result)

        elif choice == '3':
            show_history()

        elif choice == '4':
            revision_mode()

        elif choice == '5':
            show_stats()

        elif choice == '6':
            export_history()

        elif choice == '7':
            search_history()

        elif choice == '0':
            print(f"\n  {Fore.CYAN}👋 Auf Wiedersehen ! Au revoir !{Style.RESET_ALL}\n")
            sys.exit(0)

        else:
            print(f"\n  {Fore.RED}❌ Choix invalide.{Style.RESET_ALL}")

        input(f"\n  {Fore.WHITE}Appuyez sur Entrée pour continuer...{Style.RESET_ALL}")
        clear_screen()
        print_header()


if __name__ == '__main__':
    main()

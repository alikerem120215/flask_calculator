# 🧮 Flask Calculator — Güvenli Matematiksel Web Hesap Makinesi

Python ve **Flask** kullanılarak geliştirilmiş; güvenlik açıklarına karşı korunmuş (AST ve whitelist tabanlı güvenli ifade çözümleme) modern web tabanlı bilimsel hesap makinesi.

---

## 🌟 Özellikler
- **Gelişmiş Fonksiyon Desteği:** Dört işlem, üs alma (`^`), karekök (`sqrt`), trigonometri (`sin`, `cos`, `tan`), logaritma ve sabitler (`pi`, `e`).
- **Güvenli Kod Yürütme:** Standart güvensiz `eval()` yerine `math` fonksiyonları whitelist kontrolüyle çalışır.
- **Oturum Bazlı Geçmiş:** Yapılan işlemleri Flask Session ile saklar, temizlenebilir hesap geçmişi sunar.
- **Responsive Tasarım:** Mobil ve masaüstü ekranlar için optimize edilmiş şık hesap makinesi tuş takımı.

---

## 🚀 Çalıştırma

```bash
pip install Flask sympy
python3 app.py
```
Uygulama `http://127.0.0.1:5000` portunda çalışacaktır.

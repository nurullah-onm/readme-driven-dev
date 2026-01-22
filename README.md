# readme-driven-dev

CLI araci. README kontrati ile kod envanterini karsilastirir.

## 1. Problem Tanimi
- README, komutlari, flag'leri, environment variable'lari, config dosyalarini ve klasor yapisini tarif eder. Kod degisince README guncellenmez. Sonuc: dokumantasyon ile kod arasinda uyumsuzluk.
- Mevcut yaklasimlar README formatini kontrol eder veya test calistirir. README icindeki teknik sozlesmeyi kod envanteri ile birebir karsilastirmaz.

## 2. Cozum Yaklasimi

### Ne yapiyor
- README.md icindeki `rdd-contract` blokunu parse eder.
- README.md icindeki `rdd-tree` blokunu parse eder.
- README kontrati ile `.rdd/code.json` kod envanterini karsilastirir.
- `rdd-tree` icindeki her yolu dosya sisteminde arar.
- README'deki output orneklerini `docs/examples/` altindaki dosyalar ile karsilastirir.
- Sonucu `text` veya `json` formatinda uretir.

### Ne yapmiyor
- Kaynak kodu parse etmez.
- Komutlari calistirip calisma zamani davranisini olcmez.
- README disinda dokumantasyon uretmez.
- Otomatik kod degisikligi yapmaz.

## 3. Kurulum

### Desteklenen isletim sistemleri
- macOS 13
- macOS 14
- Ubuntu 22.04 LTS
- Windows 11

### Gereksinimler
- Node.js 20.x
- npm 10.x

### Kurulum komutlari
Komutlar proje kok dizininde calisir.

```bash
npm install
npm install -g .
```

## 4. Kullanim

### Komut sozdizimi
```bash
rdd <komut> [flag]
```

### Komutlar
- `verify`: README kontrati ile kod envanterini karsilastirir.
- `parse`: README kontratini JSON olarak stdout'a yazar.

### Global flag'ler
- `-h, --help`: yardim metnini yazar ve cikar.
- `--version`: surum numarasini yazar ve cikar.

### verify flag'leri
- `--root <path>`: repository root. Varsayilan deger: `.`
- `--readme <path>`: README yolu. Varsayilan deger: `README.md`
- `--format <text|json>`: cikti formati. Varsayilan deger: `text`

### parse flag'leri
- `--root <path>`: repository root. Varsayilan deger: `.`
- `--readme <path>`: README yolu. Varsayilan deger: `README.md`

### Ornekler

#### Ornek: verify basarili
```bash
rdd verify --root . --readme README.md
```

Output ID: verify-success
```rdd-output
STATUS: ok
ROOT: .
README: README.md
ERRORS: 0
```

#### Ornek: verify hatali
```bash
rdd verify --root . --readme README.md
```

Output ID: verify-failure
```rdd-output
STATUS: fail
ROOT: .
README: README.md
ERRORS: 2
- MISSING_PATH docs/examples/verify-failure.txt
- CONTRACT_MISMATCH commands.verify.flags
```

#### Ornek: parse
```bash
rdd parse --root . --readme README.md
```

Output ID: parse-output
```rdd-output
{
  "globalFlags": ["-h", "--help", "--version"],
  "commands": {
    "verify": { "flags": ["--root", "--readme", "--format"] },
    "parse": { "flags": ["--root", "--readme"] }
  },
  "env": [],
  "configFiles": [".rdd/code.json"],
  "examples": {
    "verify-success": "docs/examples/verify-success.txt",
    "verify-failure": "docs/examples/verify-failure.txt",
    "parse-output": "docs/examples/parse-output.json",
    "verify-json": "docs/examples/verify-json.json"
  }
}
```

## 5. README <-> Code Kurallari

### README'den parse edilenler
- `rdd-contract` kod blogu zorunludur. JSON object olmak zorundadir. Zorunlu alanlar:
  - `globalFlags`: string array
  - `commands`: object, her komut icin `flags` string array
  - `env`: string array
  - `configFiles`: string array, root'a gore yol
  - `examples`: object, `id` -> root'a gore yol
- `rdd-tree` kod blogu zorunludur. Agac formati ASCII olmalidir ve `|--` ile `\--` kullanir.
- `rdd-output` kod bloglari `Output ID: <id>` satirindan sonra gelir. `<id>` degeri `examples` icinde olmak zorundadir.

`rdd parse` sadece `rdd-contract` JSON verisini yazar. JSON 2 space girinti ile ve sonda tek satir sonu ile yazilir.

Bu README icindeki `rdd-contract` blogu:
```rdd-contract
{
  "globalFlags": ["-h", "--help", "--version"],
  "commands": {
    "verify": { "flags": ["--root", "--readme", "--format"] },
    "parse": { "flags": ["--root", "--readme"] }
  },
  "env": [],
  "configFiles": [".rdd/code.json"],
  "examples": {
    "verify-success": "docs/examples/verify-success.txt",
    "verify-failure": "docs/examples/verify-failure.txt",
    "parse-output": "docs/examples/parse-output.json",
    "verify-json": "docs/examples/verify-json.json"
  }
}
```

### Koddan dogrulananlar
- `.rdd/code.json` dosyasi zorunludur ve JSON object olmak zorundadir.
- `.rdd/code.json` alanlari:
  - `globalFlags`
  - `commands`
  - `env`
  - `configFiles`
- `globalFlags`, `commands`, `env`, `configFiles` degerleri README kontrati ile birebir ayni olmak zorundadir.
- `configFiles` icindeki her yol dosya sisteminde bulunmak zorundadir.
- `rdd-tree` icindeki her yol dosya sisteminde bulunmak zorundadir.
- `examples` icindeki her yol dosya sisteminde bulunmak zorundadir.
- README'deki her `rdd-output` blogu, `examples` icindeki ilgili dosya icerigi ile birebir ayni olmak zorundadir.

`.rdd/code.json` formati:
```json
{
  "globalFlags": ["-h", "--help", "--version"],
  "commands": {
    "verify": { "flags": ["--root", "--readme", "--format"] },
    "parse": { "flags": ["--root", "--readme"] }
  },
  "env": [],
  "configFiles": [".rdd/code.json"]
}
```

### Hata durumlari ve exit code'lar
Verify hata kodlari:
- `README_CONTRACT_MISSING`
- `README_CONTRACT_INVALID_JSON`
- `README_TREE_MISSING`
- `CODE_INVENTORY_MISSING`
- `CODE_INVENTORY_INVALID_JSON`
- `CONTRACT_MISMATCH`
- `MISSING_PATH`
- `OUTPUT_MISSING`
- `OUTPUT_MISMATCH`

`rdd verify` exit code:
- `0`: tum kontroller basarili
- `1`: en az bir dogrulama hatasi
- `2`: README kontrati veya code envanteri gecersiz
- `3`: ic hata

`rdd parse` exit code:
- `0`: parse basarili
- `2`: README kontrati eksik veya gecersiz JSON
- `3`: ic hata

## 6. Proje Mimarisi

### Klasor yapisi
```rdd-tree
readme-driven-dev/
|-- README.md
|-- package.json
|-- package-lock.json
|-- bin/
|   \-- rdd
|-- src/
|   |-- cli.js
|   |-- contract/
|   |   |-- parse.js
|   |   \-- validate.js
|   |-- code/
|   |   |-- load.js
|   |   \-- compare.js
|   |-- report/
|   |   |-- format-json.js
|   |   \-- format-text.js
|   \-- errors.js
|-- .rdd/
|   \-- code.json
\-- docs/
    \-- examples/
        |-- parse-output.json
        |-- verify-failure.txt
        |-- verify-json.json
        \-- verify-success.txt
```

### Ana moduller ve sorumluluklari
- `bin/rdd`: CLI giris noktasi ve komut yonlendirme.
- `src/cli.js`: arguman parsing ve komut cagirma.
- `src/contract/parse.js`: README kontratini parse eder.
- `src/contract/validate.js`: kontrat alanlarini dogrular.
- `src/code/load.js`: `.rdd/code.json` dosyasini okur.
- `src/code/compare.js`: README kontrati ile kod envanterini karsilastirir.
- `src/report/format-text.js`: text formatinda rapor uretir.
- `src/report/format-json.js`: JSON formatinda rapor uretir.
- `src/errors.js`: hata kodlari ve mesaj sablonlari.

## 7. CI / Automation
CI adiminda su komut calisir:

```bash
rdd verify --root . --readme README.md --format json
```

JSON output formati:
- `status`: `ok` veya `fail`
- `root`: string
- `readme`: string
- `errors`: object array, her eleman `code` ve `detail` alanlarini icerir

Output ID: verify-json
```rdd-output
{
  "status": "fail",
  "root": ".",
  "readme": "README.md",
  "errors": [
    { "code": "MISSING_PATH", "detail": "docs/examples/verify-failure.txt" }
  ]
}
```

## 8. Roadmap
- v1: README kontrat parse, code.json karsilastirma, tree ve output dogrulama, text ve JSON rapor.
- v1.1: JSON raporunda deterministik alan sirasi ve hata listesinin stabil sirasi.
- v2: Kaynak koddan Node.js ve Go icin komut ve flag cikarma.

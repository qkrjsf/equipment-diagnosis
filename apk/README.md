# EMQ Android 앱 (APK)

웹앱(https://qkrjsf.github.io/equipment-diagnosis/)을 그대로 불러오는 Android 앱입니다.
웹앱을 업데이트하면 앱도 자동으로 최신 버전이 열리므로, APK는 한 번 설치하면 거의 다시 만들 필요가 없습니다.
지문 인증은 기기의 생체인증(capacitor-native-biometric)을 사용합니다.

## APK 만드는 법 (GitHub Actions)
1. 이 폴더(`apk/`)와 `.github/workflows/build-apk.yml`을 웹앱과 같은 GitHub 저장소(equipment-diagnosis)에 올립니다.
   - 저장소 루트에 `apk` 폴더, `.github/workflows/build-apk.yml` 파일이 있어야 합니다.
2. 저장소의 **Actions** 탭 → **Build EMQ APK** → **Run workflow**.
3. 약 5~8분 뒤 실행 결과 화면 맨 아래 **Artifacts → EMQ-apk** 를 내려받아 압축을 풀면 `EMQ.apk`가 나옵니다.
4. 폰/태블릿으로 옮겨 설치합니다. (설정에서 '출처를 알 수 없는 앱 설치' 허용 필요)

## 참고
- 이 APK는 디버그 서명본이라 사내 배포용으로 충분합니다. Play 스토어 배포가 필요하면 릴리스 서명 키 설정을 추가해야 합니다.
- 앱 아이콘은 `assets/icon-only.png` 를 바꾸면 다음 빌드부터 반영됩니다.
- 서버 주소를 바꾸려면 `capacitor.config.json` 의 `server.url` 을 수정합니다.

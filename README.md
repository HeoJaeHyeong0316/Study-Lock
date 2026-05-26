# 📚 Study Lock

공부 과목과 목표 시간을 설정하면 목표 달성 전까지 폰 사용을 차단하는 집중 공부 앱

## 기술 스택
- **Backend** : Spring Boot (Java 17), Spring Security, JWT, JPA
- **Database** : Supabase (PostgreSQL)
- **Frontend** : React Native + Expo
- **Deployment** : Docker + Railway
- **Push Notification** : Firebase Cloud Messaging (FCM)

## 사용한 오픈소스
| 오픈소스 | 용도 |
|---|---|
| Spring Boot | REST API 서버 |
| Spring Security + JWT | 인증/보안 |
| JPA/Hibernate | DB 연동 |
| Supabase | 데이터 저장 |
| React Native | 크로스플랫폼 앱 |
| Axios | API 통신 |
| Docker | 컨테이너 배포 |
| Railway | 클라우드 배포 플랫폼 |
| Firebase Admin SDK | 푸시 알림 발송 |
| react-native-firebase | 앱 푸시 알림 수신 |

## API
| 메서드 | URL | 설명 |
|---|---|---|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| POST | `/api/auth/refresh` | 토큰 재발급 |
| POST | `/api/study/start` | 공부 시작 |
| POST | `/api/study/end` | 공부 종료 (목표 달성 시 알림 발송) |
| POST | `/api/study/escape` | 이탈 감지 |
| GET | `/api/records/today` | 오늘 기록 |
| GET | `/api/records` | 전체 기록 |
| GET | `/api/stats/weekly` | 주간 통계 |
| GET | `/api/stats/subject` | 과목별 통계 |
| GET | `/api/user/me` | 내 정보 |
| POST | `/api/user/fcm-token` | FCM 토큰 저장 |
| DELETE | `/api/user/me` | 회원 탈퇴 |

## 알림 기능
| 알림 종류 | 발송 시점 |
|---|---|
| 목표 달성 알림 | 공부 종료 시 목표 달성한 경우 |
| 매일 아침 공부 시작 알림 | 매일 오전 9시 |
| 연속 달성 축하 알림 | 추후 구현 예정 |
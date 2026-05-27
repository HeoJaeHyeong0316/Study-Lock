package org.example.study_lock.Controller;

import lombok.RequiredArgsConstructor;
import org.example.study_lock.Service.UserService;
import org.example.study_lock.dto.FcmTokenRequest;
import org.example.study_lock.dto.UserResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 내 정보 조회
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyInfo(
            @RequestHeader("Authorization") String token) {
        String accessToken = token.replace("Bearer ", "");
        return ResponseEntity.ok(userService.getMyInfo(accessToken));
    }

    // 회원 탈퇴
    @DeleteMapping("/me")
    public ResponseEntity<String> deleteUser(
            @RequestHeader("Authorization") String token) {
        String accessToken = token.replace("Bearer ", "");
        userService.deleteUser(accessToken);
        return ResponseEntity.ok("회원 탈퇴 성공");
    }
    // Fcm 토큰 저장
    @PostMapping("/fcm-token")
    public ResponseEntity<String> saveFcmToken(
            @RequestHeader("Authorization") String token,
            @RequestBody FcmTokenRequest request){
        String accessToken = token.replace("Bearer ", "");
        userService.saveFcmToken(accessToken, request.getFcmToken());
        return ResponseEntity.ok("FCM 토큰 저장 성공");
    }

}
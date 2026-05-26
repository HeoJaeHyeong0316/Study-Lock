package org.example.study_lock.Service;

import lombok.RequiredArgsConstructor;
import org.example.study_lock.Config.JWTutil;
import org.example.study_lock.Entity.User;
import org.example.study_lock.Repository.StudySessionRepository;
import org.example.study_lock.Repository.UserRepository;
import org.example.study_lock.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final StudySessionRepository studySessionRepository;
    private final JWTutil jwtUtil;

    // 내 정보 조회
    public UserResponse getMyInfo(String token) {
        String email = jwtUtil.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname()
        );
    }

    // 회원 탈퇴
    @Transactional
    public void deleteUser(String token) {
        String email = jwtUtil.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        // 세션 먼저 삭제 후 유저 삭제
        studySessionRepository.deleteByUser(user);
        userRepository.delete(user);
    }
}
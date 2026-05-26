package org.example.study_lock.Service;

import org.example.study_lock.Repository.UserRepository;
import org.example.study_lock.dto.LoginResponse;
import lombok.RequiredArgsConstructor;
import org.example.study_lock.Config.JWTutil;
import org.example.study_lock.Entity.User;
import org.example.study_lock.dto.LoginRequest;
import org.example.study_lock.dto.SignupRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTutil jwtUtil;

    // 회원가입
    public void signup(SignupRequest request) {
        // 이메일 중복 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("이미 사용 중인 이메일입니다");
        }

        // 비밀번호 암호화 후 저장
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname());

        userRepository.save(user);
    }

    // 로그인
    public LoginResponse login(LoginRequest request) {
        // 이메일로 유저 찾기
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("존재하지 않는 이메일입니다"));

        // 비밀번호 확인
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("비밀번호가 틀렸습니다");
        }

        // JWT 토큰 생성
        String accessToken = jwtUtil.generateAccessToken(user.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return new LoginResponse(accessToken, refreshToken);
    }
}
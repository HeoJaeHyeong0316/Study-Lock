package org.example.study_lock.Controller;

import lombok.RequiredArgsConstructor;
import org.example.study_lock.Service.StudyService;
import org.example.study_lock.dto.StudyEndRequest;
import org.example.study_lock.dto.StudyStartRequest;
import org.example.study_lock.dto.StudyStartResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/study")
@RequiredArgsConstructor
public class StudyController {

    private final StudyService studyService;

    // 공부 시작
    @PostMapping("/start")
    public ResponseEntity<StudyStartResponse> startStudy(
            @RequestHeader("Authorization") String token,
            @RequestBody StudyStartRequest request) {
        String accessToken = token.replace("Bearer ", "");
        StudyStartResponse response = studyService.startStudy(accessToken, request);
        return ResponseEntity.ok(response);
    }

    // 공부 종료
    @PostMapping("/end")
    public ResponseEntity<String> endStudy(
            @RequestHeader("Authorization") String token,
            @RequestBody StudyEndRequest request) {
        String accessToken = token.replace("Bearer ", "");
        studyService.endStudy(accessToken, request);
        return ResponseEntity.ok("공부 종료 완료");
    }

    // 이탈 감지
    @PostMapping("/escape")
    public ResponseEntity<Integer> escapeStudy(
            @RequestHeader("Authorization") String token,
            @RequestBody Long sessionId) {
        String accessToken = token.replace("Bearer ", "");
        int escapeCount = studyService.escapeStudy(accessToken, sessionId);
        return ResponseEntity.ok(escapeCount);
    }
}
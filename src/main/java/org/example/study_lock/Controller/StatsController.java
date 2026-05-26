package org.example.study_lock.Controller;

import lombok.RequiredArgsConstructor;
import org.example.study_lock.Service.StatsService;
import org.example.study_lock.dto.SubjectStatsResponse;
import org.example.study_lock.dto.WeeklyStatsResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    // 주간 통계
    @GetMapping("/weekly")
    public ResponseEntity<WeeklyStatsResponse> getWeeklyStats(
            @RequestHeader("Authorization") String token) {
        String accessToken = token.replace("Bearer ", "");
        return ResponseEntity.ok(statsService.getWeeklyStats(accessToken));
    }

    // 과목별 통계
    @GetMapping("/subject")
    public ResponseEntity<List<SubjectStatsResponse>> getSubjectStats(
            @RequestHeader("Authorization") String token) {
        String accessToken = token.replace("Bearer ", "");
        return ResponseEntity.ok(statsService.getSubjectStats(accessToken));
    }
}
package org.example.study_lock.Controller;

import lombok.RequiredArgsConstructor;
import org.example.study_lock.Service.RecordService;
import org.example.study_lock.dto.RecordResponse;
import org.example.study_lock.dto.TodayRecordResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class RecordController {

    private final RecordService recordService;

    // 오늘 기록 조회
    @GetMapping("/today")
    public ResponseEntity<TodayRecordResponse> getTodayRecords(
            @RequestHeader("Authorization") String token) {
        String accessToken = token.replace("Bearer ", "");
        return ResponseEntity.ok(recordService.getTodayRecords(accessToken));
    }

    // 전체 기록 조회
    @GetMapping
    public ResponseEntity<List<RecordResponse>> getAllRecords(
            @RequestHeader("Authorization") String token) {
        String accessToken = token.replace("Bearer ", "");
        return ResponseEntity.ok(recordService.getAllRecords(accessToken));
    }
}
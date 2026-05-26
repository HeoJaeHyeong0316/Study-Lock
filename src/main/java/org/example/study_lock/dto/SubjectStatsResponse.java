package org.example.study_lock.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SubjectStatsResponse {
    private String subject;   // 과목명
    private int totalTime;    // 총 공부 시간 (초)
    private int sessionCount; // 세션 수
}
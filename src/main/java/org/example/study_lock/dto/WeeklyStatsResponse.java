package org.example.study_lock.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class WeeklyStatsResponse {
    private int totalTime;        // 이번 주 총 공부 시간 (초)
    private double achieveRate;   // 달성률 (%)
    private List<DailyStats> dailyStats; // 요일별 통계

    @Getter
    @AllArgsConstructor
    public static class DailyStats {
        private String day;       // 요일 (월,화,수,목,금,토,일)
        private int totalTime;    // 해당 요일 공부 시간 (초)
        private boolean isToday;  // 오늘 여부
    }
}
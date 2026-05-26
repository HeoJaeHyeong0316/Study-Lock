package org.example.study_lock.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class TodayRecordResponse {
    private int totalTime;       // 오늘 총 공부 시간 (초)
    private int sessionCount;    // 오늘 세션 수
    private List<RecordResponse> records;
}
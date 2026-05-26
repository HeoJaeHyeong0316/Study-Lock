package org.example.study_lock.dto;

import lombok.Getter;

@Getter
public class StudyStartRequest {
    private String subject;
    private int goalTime;
}
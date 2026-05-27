package org.example.study_lock.dto;
import lombok.Getter;

@Getter
public class LoginRequest {
    private String email;
    private String password;
}
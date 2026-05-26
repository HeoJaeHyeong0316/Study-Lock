package org.example.study_lock;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class StudyLockApplication {

    public static void main(String[] args) {
        SpringApplication.run(StudyLockApplication.class, args);
    }

}

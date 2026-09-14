package com.backhaulmatch.user.service;

import com.backhaulmatch.user.entity.UserProfile;
import com.backhaulmatch.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository repository;

    public UserProfile getByUserId(Long userId) {
        return repository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
    }

    public UserProfile upsert(Long userId, UserProfile incoming) {
        UserProfile profile = repository.findByUserId(userId).orElseGet(UserProfile::new);
        profile.setUserId(userId);
        profile.setFullName(incoming.getFullName());
        profile.setPhone(incoming.getPhone());
        profile.setCompanyName(incoming.getCompanyName());
        profile.setAddress(incoming.getAddress());
        profile.setCity(incoming.getCity());
        return repository.save(profile);
    }
}

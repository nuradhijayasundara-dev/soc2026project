package com.backhaulmatch.courier.repository;

import com.backhaulmatch.courier.entity.Receiver;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReceiverRepository extends JpaRepository<Receiver, Long> {
}

package com.example.pat3.repository;

import com.example.pat3.entities.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByBuyerDetails_Name(String username);
    @Query("""
       select distinct o
       from Order o
       left join fetch o.products
       """)
    List<Order> findAllWithProducts();

    @Query("""
       select distinct o
       from Order o
       left join fetch o.products
       where o.buyerDetails.name = :username
       """)
    List<Order> findAllByBuyerNameWithProducts(@Param("username") String username);



}
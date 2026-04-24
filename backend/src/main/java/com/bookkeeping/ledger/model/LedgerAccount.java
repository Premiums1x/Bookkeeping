package com.bookkeeping.ledger.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class LedgerAccount {
  private Long id;
  private Long userId;
  private String name;
  private BigDecimal budget;
  private String month;
  private String typeFilter;
  private String dateFilter;
  private LocalDate dateValue;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Long getUserId() {
    return userId;
  }

  public void setUserId(Long userId) {
    this.userId = userId;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public BigDecimal getBudget() {
    return budget;
  }

  public void setBudget(BigDecimal budget) {
    this.budget = budget;
  }

  public String getMonth() {
    return month;
  }

  public void setMonth(String month) {
    this.month = month;
  }

  public String getTypeFilter() {
    return typeFilter;
  }

  public void setTypeFilter(String typeFilter) {
    this.typeFilter = typeFilter;
  }

  public String getDateFilter() {
    return dateFilter;
  }

  public void setDateFilter(String dateFilter) {
    this.dateFilter = dateFilter;
  }

  public LocalDate getDateValue() {
    return dateValue;
  }

  public void setDateValue(LocalDate dateValue) {
    this.dateValue = dateValue;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}

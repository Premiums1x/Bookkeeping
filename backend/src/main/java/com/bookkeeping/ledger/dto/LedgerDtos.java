package com.bookkeeping.ledger.dto;

import com.bookkeeping.ledger.dto.AccountDtos.AccountSummary;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class LedgerDtos {
  private LedgerDtos() {}

  public record LedgerSnapshot(
      boolean authenticated,
      String accountId,
      String accountName,
      String accountUsername,
      String activeAccountId,
      List<AccountSummary> accounts,
      String month,
      BigDecimal budget,
      String typeFilter,
      String dateFilter,
      String dateValue,
      List<RecordResponse> records) {}

  public record RecordResponse(
      Long id,
      String type,
      BigDecimal amount,
      String category,
      String note,
      LocalDate date) {}

  public record BudgetRequest(BigDecimal budget) {}

  public record BudgetResponse(BigDecimal budget) {}

  public record PreferencesRequest(
      String month,
      String typeFilter,
      String dateFilter,
      String dateValue,
      String dateInput) {}

  public record PreferencesResponse(String month, String typeFilter, String dateFilter, String dateValue) {}
}

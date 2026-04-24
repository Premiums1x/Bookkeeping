package com.bookkeeping.ledger.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public final class AccountDtos {
  private AccountDtos() {}

  public record AccountSummary(
      String id,
      String name,
      String username,
      String month,
      BigDecimal budget,
      int recordsCount) {}

  public record AccountsResponse(String activeAccountId, List<AccountSummary> accounts) {}

  public record CreateAccountRequest(
      @NotBlank(message = "账本名称不能为空。")
      @Size(max = 20, message = "账本名称最多 20 个字符。")
      String name) {}

  public record RenameAccountRequest(
      @NotBlank(message = "账本名称不能为空。")
      @Size(max = 20, message = "账本名称最多 20 个字符。")
      String name) {}

  public record SwitchAccountRequest(@NotBlank(message = "缺少账本 ID。") String accountId) {}
}

package com.bookkeeping.ledger.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public final class RecordDtos {
  private RecordDtos() {}

  public record RecordRequest(
      String type,
      @NotNull(message = "金额不能为空。")
      @DecimalMin(value = "0.01", message = "金额必须大于 0。")
      BigDecimal amount,
      @NotBlank(message = "分类不能为空。")
      @Size(max = 40, message = "分类最多 40 个字符。")
      String category,
      @Size(max = 255, message = "备注最多 255 个字符。")
      String note,
      @NotNull(message = "请选择有效日期。")
      LocalDate date) {}
}

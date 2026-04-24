package com.bookkeeping.ledger.controller;

import com.bookkeeping.ledger.common.ApiResponse;
import com.bookkeeping.ledger.common.BusinessException;
import com.bookkeeping.ledger.dto.LedgerDtos.RecordResponse;
import com.bookkeeping.ledger.dto.RecordDtos.RecordRequest;
import com.bookkeeping.ledger.service.RecordService;
import com.bookkeeping.ledger.service.SessionService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/records")
public class RecordController {
  private final RecordService recordService;
  private final SessionService sessionService;

  public RecordController(RecordService recordService, SessionService sessionService) {
    this.recordService = recordService;
    this.sessionService = sessionService;
  }

  @GetMapping
  public ApiResponse<List<RecordResponse>> records(
      @RequestParam(required = false) String month,
      @RequestParam(required = false, defaultValue = "all") String type,
      @RequestParam(required = false, defaultValue = "all") String dateFilter,
      @RequestParam(required = false) String dateValue,
      HttpSession session) {
    return ApiResponse.ok(recordService.search(
        sessionService.requireUserId(session),
        month,
        type,
        dateFilter,
        dateValue));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<RecordResponse> create(@Valid @RequestBody RecordRequest request, HttpSession session) {
    return ApiResponse.ok(recordService.create(sessionService.requireUserId(session), request));
  }

  @PutMapping("/{id}")
  public ApiResponse<RecordResponse> update(
      @PathVariable String id,
      @Valid @RequestBody RecordRequest request,
      HttpSession session) {
    return ApiResponse.ok(recordService.update(sessionService.requireUserId(session), parseId(id), request));
  }

  @DeleteMapping("/{id}")
  public ApiResponse<RecordResponse> delete(@PathVariable String id, HttpSession session) {
    return ApiResponse.ok(recordService.delete(sessionService.requireUserId(session), parseId(id)));
  }

  private Long parseId(String value) {
    try {
      return Long.valueOf(value);
    } catch (Exception ex) {
      throw new BusinessException("账单 ID 无效。", HttpStatus.BAD_REQUEST);
    }
  }
}

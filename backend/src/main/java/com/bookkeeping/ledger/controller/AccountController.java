package com.bookkeeping.ledger.controller;

import com.bookkeeping.ledger.common.ApiResponse;
import com.bookkeeping.ledger.common.BusinessException;
import com.bookkeeping.ledger.dto.AccountDtos.AccountsResponse;
import com.bookkeeping.ledger.dto.AccountDtos.CreateAccountRequest;
import com.bookkeeping.ledger.dto.AccountDtos.RenameAccountRequest;
import com.bookkeeping.ledger.dto.AccountDtos.SwitchAccountRequest;
import com.bookkeeping.ledger.dto.LedgerDtos.LedgerSnapshot;
import com.bookkeeping.ledger.service.LedgerService;
import com.bookkeeping.ledger.service.SessionService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
  private final LedgerService ledgerService;
  private final SessionService sessionService;

  public AccountController(LedgerService ledgerService, SessionService sessionService) {
    this.ledgerService = ledgerService;
    this.sessionService = sessionService;
  }

  @GetMapping
  public ApiResponse<AccountsResponse> accounts(HttpSession session) {
    return ApiResponse.ok(ledgerService.accounts(sessionService.requireUserId(session)));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<LedgerSnapshot> create(@Valid @RequestBody CreateAccountRequest request, HttpSession session) {
    return ApiResponse.ok(ledgerService.createAccount(sessionService.requireUserId(session), request.name()));
  }

  @PutMapping("/{id}")
  public ApiResponse<AccountsResponse> rename(
      @PathVariable String id,
      @Valid @RequestBody RenameAccountRequest request,
      HttpSession session) {
    return ApiResponse.ok(ledgerService.renameAccount(sessionService.requireUserId(session), parseId(id), request.name()));
  }

  @DeleteMapping("/{id}")
  public ApiResponse<LedgerSnapshot> delete(@PathVariable String id, HttpSession session) {
    return ApiResponse.ok(ledgerService.deleteAccount(sessionService.requireUserId(session), parseId(id)));
  }

  @PutMapping("/active")
  public ApiResponse<LedgerSnapshot> switchActive(
      @Valid @RequestBody SwitchAccountRequest request,
      HttpSession session) {
    return ApiResponse.ok(ledgerService.switchAccount(sessionService.requireUserId(session), parseId(request.accountId())));
  }

  private Long parseId(String value) {
    try {
      return Long.valueOf(value);
    } catch (Exception ex) {
      throw new BusinessException("账本 ID 无效。", HttpStatus.BAD_REQUEST);
    }
  }
}

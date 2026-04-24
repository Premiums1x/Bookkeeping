package com.bookkeeping.ledger.service;

import com.bookkeeping.ledger.common.BusinessException;
import com.bookkeeping.ledger.dto.LedgerDtos.RecordResponse;
import com.bookkeeping.ledger.dto.RecordDtos.RecordRequest;
import com.bookkeeping.ledger.mapper.RecordMapper;
import com.bookkeeping.ledger.model.LedgerAccount;
import com.bookkeeping.ledger.model.RecordEntry;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecordService {
  private final LedgerService ledgerService;
  private final RecordMapper recordMapper;

  public RecordService(LedgerService ledgerService, RecordMapper recordMapper) {
    this.ledgerService = ledgerService;
    this.recordMapper = recordMapper;
  }

  public List<RecordResponse> search(Long userId, String month, String type, String dateFilter, String dateValue) {
    LedgerAccount active = ledgerService.requireActiveAccount(userId);
    LocalDate today = LocalDate.now();
    LocalDate startDate = today.minusDays(6);
    LocalDate parsedDateValue = "custom".equals(dateFilter) ? parseDate(dateValue) : null;
    return recordMapper.search(active.getId(), month, type, dateFilter, parsedDateValue, today, startDate, today)
        .stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional
  public RecordResponse create(Long userId, RecordRequest request) {
    LedgerAccount active = ledgerService.requireActiveAccount(userId);
    RecordEntry record = new RecordEntry();
    applyRequest(record, request);
    record.setAccountId(active.getId());
    recordMapper.insert(record);
    return toResponse(record);
  }

  @Transactional
  public RecordResponse update(Long userId, Long recordId, RecordRequest request) {
    LedgerAccount active = ledgerService.requireActiveAccount(userId);
    RecordEntry existing = recordMapper.findByIdAndAccountId(recordId, active.getId());
    if (existing == null) throw new BusinessException("未找到该账单记录。", HttpStatus.NOT_FOUND);
    applyRequest(existing, request);
    recordMapper.update(existing);
    return toResponse(recordMapper.findByIdAndAccountId(recordId, active.getId()));
  }

  @Transactional
  public RecordResponse delete(Long userId, Long recordId) {
    LedgerAccount active = ledgerService.requireActiveAccount(userId);
    RecordEntry existing = recordMapper.findByIdAndAccountId(recordId, active.getId());
    if (existing == null) throw new BusinessException("未找到该账单记录。", HttpStatus.NOT_FOUND);
    recordMapper.deleteByIdAndAccountId(recordId, active.getId());
    return toResponse(existing);
  }

  private void applyRequest(RecordEntry record, RecordRequest request) {
    record.setType("income".equals(request.type()) ? "income" : "expense");
    record.setAmount(request.amount());
    record.setCategory(request.category().trim());
    record.setNote(request.note() == null ? "" : request.note().trim());
    record.setRecordDate(request.date());
  }

  private RecordResponse toResponse(RecordEntry record) {
    return new RecordResponse(
        record.getId(),
        record.getType(),
        record.getAmount(),
        record.getCategory(),
        record.getNote(),
        record.getRecordDate());
  }

  private LocalDate parseDate(String value) {
    try {
      return LocalDate.parse(value);
    } catch (Exception ex) {
      throw new BusinessException("自定义日期格式无效。");
    }
  }
}

package com.bookkeeping.ledger.mapper;

import com.bookkeeping.ledger.model.RecordEntry;
import java.time.LocalDate;
import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface RecordMapper {
  @Select("""
      SELECT *
      FROM records
      WHERE account_id = #{accountId}
      ORDER BY record_date DESC, id DESC
      """)
  List<RecordEntry> findByAccountId(Long accountId);

  @Select("""
      <script>
      SELECT *
      FROM records
      WHERE account_id = #{accountId}
      <if test="month != null and month != ''">
        AND DATE_FORMAT(record_date, '%Y-%m') = #{month}
      </if>
      <if test="type != null and type != '' and type != 'all'">
        AND type = #{type}
      </if>
      <if test="dateFilter == 'today' and today != null">
        AND record_date = #{today}
      </if>
      <if test="dateFilter == 'last7' and startDate != null and endDate != null">
        AND record_date BETWEEN #{startDate} AND #{endDate}
      </if>
      <if test="dateFilter == 'custom' and dateValue != null">
        AND record_date = #{dateValue}
      </if>
      ORDER BY record_date DESC, id DESC
      </script>
      """)
  List<RecordEntry> search(
      @Param("accountId") Long accountId,
      @Param("month") String month,
      @Param("type") String type,
      @Param("dateFilter") String dateFilter,
      @Param("dateValue") LocalDate dateValue,
      @Param("today") LocalDate today,
      @Param("startDate") LocalDate startDate,
      @Param("endDate") LocalDate endDate);

  @Select("SELECT COUNT(*) FROM records WHERE account_id = #{accountId}")
  int countByAccountId(Long accountId);

  @Select("SELECT * FROM records WHERE id = #{id} AND account_id = #{accountId}")
  RecordEntry findByIdAndAccountId(@Param("id") Long id, @Param("accountId") Long accountId);

  @Insert("""
      INSERT INTO records (account_id, type, amount, category, note, record_date)
      VALUES (#{accountId}, #{type}, #{amount}, #{category}, #{note}, #{recordDate})
      """)
  @Options(useGeneratedKeys = true, keyProperty = "id")
  int insert(RecordEntry record);

  @Update("""
      UPDATE records
      SET type = #{type},
          amount = #{amount},
          category = #{category},
          note = #{note},
          record_date = #{recordDate}
      WHERE id = #{id} AND account_id = #{accountId}
      """)
  int update(RecordEntry record);

  @Delete("DELETE FROM records WHERE id = #{id} AND account_id = #{accountId}")
  int deleteByIdAndAccountId(@Param("id") Long id, @Param("accountId") Long accountId);
}

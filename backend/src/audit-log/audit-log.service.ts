import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(params: {
    tenantId: string;
    userId: string;
    action: string;
    entityName: string;
    entityId?: string;
    details?: string;
  }): Promise<void> {
    const entry = this.auditLogRepository.create(params);
    await this.auditLogRepository.save(entry);
  }

  async findByTenant(tenantId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { tenantId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}

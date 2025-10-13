#!/usr/bin/env python
import sys
sys.path.append('.')

from app import create_app
from bom_system.models import BomTable

app = create_app()

with app.app_context():
    # 查看所有零件
    parts = BomTable.query.all()
    print(f'Total parts: {len(parts)}')
    
    # 显示前10个零件
    for i, part in enumerate(parts[:10]):
        print(f'{i+1}. ID: {part.id}, Part Number: {part.part_number}, Part Name: {part.part_name}, Project ID: {part.project_id}')
    
    # 查找测试零件（假设测试零件的part_number包含"test"或"测试"）
    test_parts = []
    for part in parts:
        part_number = str(part.part_number or '').lower()
        part_name = str(part.part_name or '').lower()
        if 'test' in part_number or '测试' in part_number or 'test' in part_name or '测试' in part_name:
            test_parts.append(part)
    
    print(f'\nFound {len(test_parts)} test parts:')
    for part in test_parts:
        print(f'ID: {part.id}, Part Number: {part.part_number}, Part Name: {part.part_name}')
    
    # 删除测试零件
    if test_parts:
        print('\nDeleting test parts...')
        for part in test_parts:
            print(f'Deleting part: {part.part_number} - {part.part_name}')
            BomTable.query.session.delete(part)
        
        BomTable.query.session.commit()
        print('Test parts deleted successfully!')
    else:
        print('\nNo test parts found to delete.')
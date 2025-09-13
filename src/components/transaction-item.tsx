'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ChevronDown, 
  ChevronRight, 
  DollarSign,
  Calendar,
  Hash,
  Info
} from 'lucide-react';
import type { Transaction } from '@/hooks/use-transactions';

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionTypeInfo = (type: string) => {
    const typeMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      'TASK_INCOME': {
        label: 'Task Reward',
        color: 'text-green-600',
        icon: <ArrowUpRight className="h-4 w-4" />
      },
      'REFERRAL_REWARD_A': {
        label: 'Level A Referral',
        color: 'text-blue-600',
        icon: <ArrowUpRight className="h-4 w-4" />
      },
      'REFERRAL_REWARD_B': {
        label: 'Level B Referral',
        color: 'text-blue-600',
        icon: <ArrowUpRight className="h-4 w-4" />
      },
      'REFERRAL_REWARD_C': {
        label: 'Level C Referral',
        color: 'text-blue-600',
        icon: <ArrowUpRight className="h-4 w-4" />
      },
      'MANAGEMENT_BONUS_DIRECT': {
        label: 'Direct Management Bonus',
        color: 'text-purple-600',
        icon: <ArrowUpRight className="h-4 w-4" />
      },
      'MANAGEMENT_BONUS_INDIRECT': {
        label: 'Indirect Management Bonus',
        color: 'text-purple-600',
        icon: <ArrowUpRight className="h-4 w-4" />
      },
      'DEBIT': {
        label: 'Withdrawal',
        color: 'text-red-600',
        icon: <ArrowDownLeft className="h-4 w-4" />
      },
      'CREDIT': {
        label: 'Credit',
        color: 'text-green-600',
        icon: <ArrowUpRight className="h-4 w-4" />
      },
    };

    return typeMap[type] || {
      label: type.replace(/_/g, ' '),
      color: 'text-gray-600',
      icon: <DollarSign className="h-4 w-4" />
    };
  };

  const typeInfo = getTransactionTypeInfo(transaction.type);
  const isPositive = transaction.amount > 0;

  return (
    <Card className="mb-2">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                  <div className={typeInfo.color}>
                    {typeInfo.icon}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{typeInfo.label}</h4>
                    <Badge 
                      variant={transaction.status === 'COMPLETED' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{transaction.description}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(transaction.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}PKR{Math.abs(transaction.amount).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Balance: PKR{transaction.balanceAfter.toFixed(2)}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="p-1">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 border-t bg-gray-50">
            <div className="pt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Hash className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Reference:</span>
                <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                  {transaction.referenceId}
                </code>
              </div>

              {transaction.metadata && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Details:</span>
                  </div>
                  <div className="bg-white p-2 rounded border text-xs">
                    <pre className="whitespace-pre-wrap text-gray-700">
                      {JSON.stringify(transaction.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

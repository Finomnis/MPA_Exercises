function B_filt = medianFilter(B,len,dim)
% B:   Matrix
% len: Length of the median filter
% dim: Either 'h' (horizontally) or 'p' (vertically)

s = size(B);
B_filt = zeros(s);

switch dim
    case 'h'
        BPadded = [zeros(s(1),floor(len/2)) B zeros(s(1),ceil(len/2))];
        for i = 1 : s(2)
            B_filt(:,i) = median(BPadded(:,i:i+len-1),2);
        end
        
    case 'p'
        BPadded = [zeros(floor(len/2),s(2));B;zeros(ceil(len/2),s(2))];
        for i = 1 : s(1)
            B_filt(i,:) = median(BPadded(i:i+len-1,:),1);
        end
             
    otherwise
        error('unvalid dim.')
end 

end
function novelty = onsetDetection(x,N,H,J)
% x:      Input signal
% N:      Frame length
% H:      Hopsize
% J:      Neighborhood

%% short-time power
P = stp(x, N, H);
size(P)

%% local average
filter = ones([2*J, 1])./(2*J+1);
P_avg = conv(P, filter, 'same');

%% novelty
tmp = P-P_avg;
novelty = tmp.*(tmp>zeros(size(tmp)));

end
function novelty = onsetDetection(x,N,H,J)
% x:      Input signal
% N:      Frame length
% H:      Hopsize
% J:      Neighborhood

%% short-time power
x_p = stp(x, N, H);

%% local average
average_filter = ones(2*J + 1, 1)./(2*J+1);
x_p_average = conv(x_p, average_filter, 'same');

%% novelty
novelty = x_p-x_p_average;
novelty(novelty<0) = 0;


end